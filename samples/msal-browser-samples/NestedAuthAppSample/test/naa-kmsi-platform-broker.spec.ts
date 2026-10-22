/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IdTokenClaims } from "@azure/msal-common";
import { assertKmsiSigninState } from "e2e-test-utils";
import { Frame, Page } from "playwright-core";
import {
    BrokerContext,
    closeBrokerContext,
    launchBrokerContext,
} from "./brokerHarness";
import {
    accessTokenForScopesExists,
    enterAadCredentials,
    getLabCredentials,
    readBrowserTokenStore,
    readAccountKeys,
    readSessionTokenStore,
} from "./naaTestUtils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const HOST_URL = `https://localhost:${HOST_APP_PORT}?kmsi=true`;
const NESTED_URL = `https://localhost:${NESTED_APP_PORT}`;
const ACTION_TIMEOUT = 60000;
const SCOPES = ["User.Read"];
const TOKEN_APIS = [
    { name: "acquireTokenSilent", bridge: "GetToken", silent: true },
    { name: "ssoSilent", bridge: "GetToken", silent: true },
    { name: "acquireTokenPopup", bridge: "GetTokenPopup", silent: false },
    { name: "loginPopup", bridge: "GetTokenPopup", silent: false },
] as const;

interface HostAuthResult {
    fromPlatformBroker: boolean;
    correlationId: string;
    account: {
        homeAccountId: string;
        nativeAccountId: string;
    };
    idTokenClaims: IdTokenClaims;
}

interface BridgeRequest {
    messageType: string;
    method: string;
    tokenParams?: {
        clientId: string;
        correlationId: string;
        scope: string;
    };
}

declare global {
    interface Window {
        __naaKmsiRequests: BridgeRequest[];
    }
}

async function observeBridgeRequests(page: Page): Promise<void> {
    await page.addInitScript((nestedOrigin) => {
        window.__naaKmsiRequests = [];
        window.addEventListener("message", (event) => {
            if (
                event.origin !== nestedOrigin ||
                event.source !==
                    document.querySelector<HTMLIFrameElement>(
                        "iframe[title='nestedApp']"
                    )?.contentWindow ||
                typeof event.data !== "string"
            ) {
                return;
            }
            let request: BridgeRequest;
            try {
                request = JSON.parse(event.data);
            } catch {
                // Other postMessage traffic is not part of the NAA protocol.
                return;
            }
            if (request?.messageType === "NestedAppAuthRequest") {
                window.__naaKmsiRequests.push(request);
            }
        });
    }, NESTED_URL);
}

async function readHostAuthResult(page: Page): Promise<HostAuthResult> {
    await page
        .locator("[data-testid='authResult'], [data-testid='hostError']")
        .waitFor({ timeout: ACTION_TIMEOUT });
    const error = page.locator("[data-testid='hostError']");
    if (await error.count()) {
        throw new Error(
            `Host authentication failed: ${await error.innerText()}`
        );
    }
    const result: HostAuthResult = JSON.parse(
        await page.locator("[data-testid='authResult']").innerText()
    );
    expect(result.fromPlatformBroker).toBe(true);
    expect(result.account.homeAccountId).toBeTruthy();
    expect(result.account.nativeAccountId).toBeTruthy();
    assertKmsiSigninState(result.idTokenClaims);
    return result;
}

async function getNestedFrame(page: Page): Promise<Frame> {
    const handle = await page.waitForSelector("iframe[title='nestedApp']", {
        timeout: ACTION_TIMEOUT,
    });
    const frame = await handle.contentFrame();
    if (!frame) {
        throw new Error("Nested app iframe has no content frame");
    }
    await frame.waitForSelector("#acquireTokenSilent", {
        timeout: ACTION_TIMEOUT,
    });
    return frame;
}

async function resetNestedFrame(page: Page): Promise<Frame> {
    const frame = await getNestedFrame(page);
    await frame.evaluate(() => window.sessionStorage.clear());
    await Promise.all([
        frame.waitForNavigation({
            waitUntil: "domcontentloaded",
            timeout: ACTION_TIMEOUT,
        }),
        page.evaluate(() => {
            const iframe = document.querySelector<HTMLIFrameElement>(
                "iframe[title='nestedApp']"
            );
            if (!iframe) {
                throw new Error("Nested app iframe is missing");
            }
            iframe.src = iframe.src;
        }),
    ]);
    await frame.waitForSelector("#acquireTokenSilent", {
        timeout: ACTION_TIMEOUT,
    });
    return frame;
}

async function verifyHostTokenStore(page: Page): Promise<void> {
    const store = await readBrowserTokenStore(page, "localStorage");
    expect(store.idTokens).toHaveLength(1);
    expect(store.accessTokens).toHaveLength(0);
    expect(store.refreshTokens).toHaveLength(0);
    expect(await readAccountKeys(page, "localStorage")).toHaveLength(1);
}

describe("Keep Me Signed In + NAA through the platform broker", () => {
    jest.setTimeout(300000);

    let broker: BrokerContext | undefined;
    let hostPage: Page;
    let initialHostResult: HostAuthResult;

    async function openHost(): Promise<void> {
        if (!broker?.extensionPresent) {
            throw new Error(
                "KMSI + NAA requires the Microsoft SSO extension, BrowserCore, " +
                    "and a KMSI-enabled WAM account on a self-hosted Windows agent. " +
                    "See the NestedAuthAppSample README."
            );
        }
        hostPage = await broker.context.newPage();
        await observeBridgeRequests(hostPage);
        await hostPage.goto(HOST_URL, {
            waitUntil: "domcontentloaded",
            timeout: ACTION_TIMEOUT,
        });
        const loginButton = hostPage.getByRole("button", {
            name: "Login",
            exact: true,
        });
        try {
            await loginButton.waitFor({ timeout: 10000 });
        } catch {
            await hostPage.reload({
                waitUntil: "domcontentloaded",
                timeout: ACTION_TIMEOUT,
            });
            await loginButton.waitFor({ timeout: ACTION_TIMEOUT });
        }
    }

    async function acquireNestedToken(
        api: (typeof TOKEN_APIS)[number]
    ): Promise<void> {
        // Discard the host's in-memory native token cache so every API reaches WAM.
        await hostPage.reload({
            waitUntil: "domcontentloaded",
            timeout: ACTION_TIMEOUT,
        });
        const frame = await resetNestedFrame(hostPage);
        await frame.waitForSelector(`#${api.name}`, {
            timeout: ACTION_TIMEOUT,
        });
        expect(await readSessionTokenStore(frame)).toEqual({
            idTokens: [],
            accessTokens: [],
            refreshTokens: [],
        });
        expect(await readAccountKeys(frame)).toBeNull();
        await hostPage.evaluate(() => {
            window.__naaKmsiRequests = [];
        });

        const popups: Page[] = [];
        const onPage = (page: Page): void => {
            popups.push(page);
        };
        hostPage.context().on("page", onPage);
        try {
            await frame.locator(`#${api.name}`).click({
                timeout: ACTION_TIMEOUT,
            });
            await frame
                .locator(
                    `[data-testid='lastApi'][data-api='${api.name}'], ` +
                        `[data-testid='apiError'][data-api='${api.name}']`
                )
                .waitFor({ timeout: ACTION_TIMEOUT });
            const error = frame.locator("[data-testid='apiError']");
            if (await error.count()) {
                throw new Error(
                    `Nested ${api.name} failed: ${await error.innerText()}`
                );
            }
            if (api.silent) {
                expect(popups).toHaveLength(0);
            }
        } finally {
            hostPage.context().off("page", onPage);
        }

        const requests = await hostPage.evaluate(
            () => window.__naaKmsiRequests
        );
        const tokenRequests = requests.filter(
            (request) =>
                request.method === "GetToken" ||
                request.method === "GetTokenPopup"
        );
        expect(tokenRequests).toHaveLength(1);
        expect(tokenRequests[0].method).toBe(api.bridge);
        const tokenParams = tokenRequests[0].tokenParams;
        if (!tokenParams) {
            throw new Error("NAA token request did not contain tokenParams");
        }
        expect(tokenParams.clientId).toBeTruthy();
        expect(tokenParams.scope.toLowerCase().split(" ")).toEqual(
            expect.arrayContaining(SCOPES.map((scope) => scope.toLowerCase()))
        );
        await hostPage.waitForFunction(
            (correlationId) => {
                const result = document.querySelector(
                    "[data-testid='authResult']"
                )?.textContent;
                return (
                    result && JSON.parse(result).correlationId === correlationId
                );
            },
            tokenParams.correlationId,
            { timeout: ACTION_TIMEOUT }
        );
        const hostResult = await readHostAuthResult(hostPage);
        expect(hostResult.correlationId).toBe(tokenParams.correlationId);
        expect(hostResult.account.homeAccountId).toBe(
            initialHostResult.account.homeAccountId
        );
        expect(hostResult.account.nativeAccountId).toBeTruthy();
        await verifyHostTokenStore(hostPage);

        const store = await readSessionTokenStore(frame);
        expect(store.idTokens).toHaveLength(1);
        expect(store.accessTokens).toHaveLength(1);
        expect(store.refreshTokens).toHaveLength(0);
        expect(accessTokenForScopesExists(store.accessTokens, SCOPES)).toBe(
            true
        );
        const accountKeys = await readAccountKeys(frame);
        expect(accountKeys).toHaveLength(1);
        const nestedAccount = await frame.evaluate((key) => {
            if (!key) {
                throw new Error("Nested account cache key is missing");
            }
            const cachedAccount = window.sessionStorage.getItem(key);
            if (!cachedAccount) {
                throw new Error("Nested account cache entry is missing");
            }
            return JSON.parse(cachedAccount) as {
                homeAccountId?: string;
                nativeAccountId?: string;
            };
        }, accountKeys?.[0]);
        expect(nestedAccount.homeAccountId).toBe(
            initialHostResult.account.homeAccountId
        );
        expect(nestedAccount.nativeAccountId).toBe(
            hostResult.account.nativeAccountId
        );
        const idToken: string = await frame.evaluate((key) => {
            const cachedToken = window.sessionStorage.getItem(key);
            if (!cachedToken) {
                throw new Error("Nested ID token cache entry is missing");
            }
            const token: { secret?: string } = JSON.parse(cachedToken);
            if (!token.secret) {
                throw new Error("Nested ID token cache entry has no secret");
            }
            return token.secret;
        }, store.idTokens[0]);
        const payload = idToken.split(".")[1];
        if (!payload) {
            throw new Error("Nested ID token has no JWT claims payload");
        }
        const claims: IdTokenClaims = JSON.parse(
            Buffer.from(payload, "base64url").toString("utf8")
        );
        assertKmsiSigninState(claims);
        expect(claims.aud).toBe(tokenParams.clientId);
        expect(
            await frame
                .locator("[data-testid='lastApi'] tbody td")
                .first()
                .innerText()
        ).toBe(initialHostResult.account.homeAccountId);
    }

    beforeAll(async () => {
        // Jest's global setup owns the two HTTPS sample servers.
        broker = await launchBrokerContext();
        await openHost();
        const popupPromise = broker.context
            .waitForEvent("page", { timeout: 15000 })
            .catch(() => null);
        await hostPage
            .getByRole("button", { name: "Login", exact: true })
            .click({
                timeout: ACTION_TIMEOUT,
            });
        const popup = await popupPromise;
        if (popup) {
            await popup.waitForLoadState("domcontentloaded");
            const loginInput = popup
                .locator("input[type='email'], #i0116")
                .first();
            const hasLogin = await loginInput
                .waitFor({ state: "visible", timeout: 10000 })
                .then(() => true)
                .catch(() => false);
            if (hasLogin) {
                const { username, password } = await getLabCredentials();
                await enterAadCredentials(popup, username, password);
            }
        }
        initialHostResult = await readHostAuthResult(hostPage);
        await verifyHostTokenStore(hostPage);
    });

    afterAll(async () => {
        await closeBrokerContext(broker);
    });

    it.each(TOKEN_APIS)(
        "$name returns a KMSI token for the nested app via $bridge",
        acquireNestedToken
    );

    it("restores the same KMSI account and both silent NAA APIs after a browser restart", async () => {
        if (!broker) {
            throw new Error("Platform-broker context was not created");
        }
        const userDataDir = broker.userDataDir;
        await broker.context.close();
        broker = await launchBrokerContext(userDataDir);
        await openHost();
        expect(await readBrowserTokenStore(hostPage, "localStorage")).toEqual({
            idTokens: expect.any(Array),
            accessTokens: [],
            refreshTokens: [],
        });
        expect(
            (await readBrowserTokenStore(hostPage, "localStorage")).idTokens
        ).toHaveLength(1);
        expect(await readAccountKeys(hostPage, "localStorage")).toHaveLength(1);

        const popups: Page[] = [];
        const onPage = (page: Page): void => {
            popups.push(page);
        };
        broker.context.on("page", onPage);
        try {
            await hostPage
                .getByRole("button", { name: "ssoSilent", exact: true })
                .click({ timeout: ACTION_TIMEOUT });
            const restoredResult = await readHostAuthResult(hostPage);
            expect(restoredResult.account).toEqual(initialHostResult.account);
            await verifyHostTokenStore(hostPage);
            for (const api of TOKEN_APIS.filter((api) => api.silent)) {
                await acquireNestedToken(api);
            }
            expect(popups).toHaveLength(0);
        } finally {
            broker.context.off("page", onPage);
        }
    });
});
