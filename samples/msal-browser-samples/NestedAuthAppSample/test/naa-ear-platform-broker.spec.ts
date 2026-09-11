/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { BrowserContext, Frame, Page } from "playwright-core";
import {
    BrokerContext,
    TokenStore,
    accessTokenForScopesExists,
    closeBrokerContext,
    enterAadCredentials,
    getEarDecryptCount,
    installEarDecryptSpy,
    launchBrokerContext,
    readAccountKeys,
    readSessionTokenStore,
} from "./brokerHarness";
import { getLabCredentials } from "./naaTestUtils";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const SAMPLE_ROOT = path.join(__dirname, "..");
const HOST_URL = `https://localhost:${HOST_APP_PORT}/?ear=true`;
const NESTED_IFRAME = "iframe[title='nestedApp']";
const SCOPES = ["User.Read"];
const ACTION_TIMEOUT = 60000;
const SERVER_READY_TIMEOUT_MS = 120000;
const UNSUPPORTED_METHOD_CODE = "unsupported_method";
const TOKEN_APIS = [
    { name: "acquireTokenSilent", bridge: "GetToken" },
    { name: "ssoSilent", bridge: "GetToken" },
    { name: "acquireTokenPopup", bridge: "GetTokenPopup" },
    { name: "loginPopup", bridge: "GetTokenPopup" },
] as const;

async function getNestedFrame(hostPage: Page): Promise<Frame> {
    const handle = await hostPage.waitForSelector(NESTED_IFRAME, {
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

async function resetNestedFrame(hostPage: Page): Promise<Frame> {
    const frame = await getNestedFrame(hostPage);
    await frame.evaluate(() => window.sessionStorage.clear());
    await hostPage.evaluate((selector) => {
        const iframe = document.querySelector(
            selector
        ) as HTMLIFrameElement | null;
        if (iframe) {
            // eslint-disable-next-line no-self-assign
            iframe.src = iframe.src;
        }
    }, NESTED_IFRAME);
    return getNestedFrame(hostPage);
}

function assertNestedTokenStore(store: TokenStore): void {
    expect(store.idTokens.length).toBe(1);
    expect(store.accessTokens.length).toBe(1);
    expect(store.refreshTokens.length).toBe(0);
    expect(accessTokenForScopesExists(store.accessTokens, SCOPES)).toBe(true);
}

describe("NAA token APIs + EAR brokered through the platform broker", () => {
    jest.setTimeout(300000);

    let broker: BrokerContext;
    let context: BrowserContext;
    let hostPage: Page;
    let nestedFrame: Frame;
    let serverProcess: ChildProcess;
    let username: string;
    let password: string;

    function autoCompleteAadPopups(): void {
        context.on("page", async (popup) => {
            try {
                await popup.waitForLoadState("domcontentloaded");
                const hasLogin = await popup
                    .locator("input[type='email'], #i0116")
                    .first()
                    .isVisible()
                    .catch(() => false);
                if (hasLogin) {
                    await enterAadCredentials(popup, username, password);
                }
            } catch {
                // Popup closed itself after silent broker completion.
            }
        });
    }

    beforeAll(async () => {
        await serverUtils.killServer(HOST_APP_PORT);
        await serverUtils.killServer(NESTED_APP_PORT);
        serverProcess = spawn("node server.js --https", {
            shell: true,
            cwd: SAMPLE_ROOT,
            stdio: ["ignore", "inherit", "inherit"],
        });
        const [hostUp, nestedUp] = await Promise.all([
            serverUtils.isServerUp(HOST_APP_PORT, SERVER_READY_TIMEOUT_MS),
            serverUtils.isServerUp(NESTED_APP_PORT, SERVER_READY_TIMEOUT_MS),
        ]);
        if (!hostUp || !nestedUp) {
            throw new Error(
                `NAA broker e2e: sample servers did not start within ` +
                    `${SERVER_READY_TIMEOUT_MS}ms (host:${hostUp} nested:${nestedUp}).`
            );
        }

        ({ username, password } = await getLabCredentials());
        broker = await launchBrokerContext();
        if (!broker.extensionPresent) {
            throw new Error(
                "The Microsoft SSO extension did not force-install into the test " +
                    "profile, so the platform broker is unavailable. This spec must " +
                    "run on a self-hosted, WAM-enabled Windows agent (see brokerHarness.ts)."
            );
        }
        context = broker.context;
        await installEarDecryptSpy(context);

        hostPage = await context.newPage();
        await hostPage.goto(HOST_URL, {
            waitUntil: "domcontentloaded",
        });

        const popupPromise = context
            .waitForEvent("page", { timeout: 15000 })
            .catch(() => null);
        await hostPage
            .getByRole("button", { name: "Login" })
            .click({ timeout: ACTION_TIMEOUT });
        const popup = await popupPromise;
        if (popup) {
            await popup.waitForLoadState("domcontentloaded");
            const hasLogin = await popup
                .locator("input[type='email'], #i0116")
                .first()
                .isVisible()
                .catch(() => false);
            if (hasLogin) {
                await enterAadCredentials(popup, username, password);
            }
        }

        await hostPage
            .getByText("Signed in as", { exact: false })
            .waitFor({ timeout: ACTION_TIMEOUT });

        const hostStore = await readSessionTokenStore(hostPage);
        expect(hostStore.refreshTokens.length).toBe(0);
        expect(hostStore.idTokens.length).toBe(1);
        expect(await readAccountKeys(hostPage)).not.toBeNull();
        expect(await getEarDecryptCount(hostPage)).toBeGreaterThan(0);

        autoCompleteAadPopups();
        nestedFrame = await getNestedFrame(hostPage);
    });

    afterAll(async () => {
        await closeBrokerContext(broker);
        if (serverProcess && serverProcess.exitCode === null) {
            serverProcess.kill();
        }
        await serverUtils.killServer(HOST_APP_PORT);
        await serverUtils.killServer(NESTED_APP_PORT);
    });

    beforeEach(async () => {
        nestedFrame = await resetNestedFrame(hostPage);
    });

    it.each(TOKEN_APIS)(
        "nested app acquires a token via $name ($bridge) through the broker",
        async ({ name }) => {
            const decryptCountBeforeNested = await getEarDecryptCount(hostPage);
            await nestedFrame
                .locator(`#${name}`)
                .click({ timeout: ACTION_TIMEOUT });

            const resultTable = nestedFrame.locator(
                `table[data-testid='lastApi'][data-api='${name}']`
            );
            await resultTable.waitFor({ timeout: ACTION_TIMEOUT });

            expect(await readAccountKeys(nestedFrame)).not.toBeNull();
            const nestedStore = await readSessionTokenStore(nestedFrame);
            assertNestedTokenStore(nestedStore);
            expect(await getEarDecryptCount(hostPage)).toBeGreaterThan(
                decryptCountBeforeNested
            );
        }
    );

    it("nested app rejects acquireTokenRedirect as unsupported", async () => {
        const before = await readSessionTokenStore(nestedFrame);

        await nestedFrame
            .locator("#acquireTokenRedirect")
            .click({ timeout: ACTION_TIMEOUT });

        const errorEl = nestedFrame.locator(
            "pre[data-testid='apiError'][data-api='acquireTokenRedirect']"
        );
        await errorEl.waitFor({ timeout: ACTION_TIMEOUT });
        expect(await errorEl.getAttribute("data-error-code")).toBe(
            UNSUPPORTED_METHOD_CODE
        );

        const after = await readSessionTokenStore(nestedFrame);
        expect(after.idTokens.length).toBe(before.idTokens.length);
        expect(after.accessTokens.length).toBe(before.accessTokens.length);
        expect(after.refreshTokens.length).toBe(0);
    });
});
