/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Platform-broker (JS-WAM) Nested App Authentication e2e.
//
// Exercises every token API a nestable public client supports — acquireTokenSilent
// and ssoSilent (bridge GetToken), acquireTokenPopup and loginPopup (bridge
// GetTokenPopup) — asserting the nested app receives tokens through the host's
// broker. The broker signature: neither the host nor the nested cache holds a
// refresh token (the OS broker holds it). Also asserts acquireTokenRedirect is
// rejected as unsupported.
//
// Self-hosted only: requires branded Chrome, the Microsoft SSO extension, WAM,
// and lab credentials, so it is excluded from CI by the `naa-basic` testFilter
// in the e2e pipeline. Run locally via `npm run test:e2e:broker`.

import { BrowserContext, Page, Frame } from "playwright";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import {
    LabClient,
    setupCredentials,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
} from "e2e-test-utils";
import {
    launchBrokerContext,
    closeBrokerContext,
    BrokerContext,
    enterAadCredentials,
    readSessionTokenStore,
    readAccountKeys,
    accessTokenForScopesExists,
    TokenStore,
} from "./brokerHarness";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const SAMPLE_ROOT = path.join(__dirname, "..");
const HOST_URL = `https://localhost:${HOST_APP_PORT}`;
const NESTED_IFRAME = "iframe[title='nestedApp']";
const SCOPES = ["User.Read"];
const ACTION_TIMEOUT = 60000;
const SERVER_READY_TIMEOUT_MS = 120000;

// Error code NestedAppAuthController throws for unsupported APIs (e.g. redirect).
const UNSUPPORTED_METHOD_CODE = "unsupported_method";

// The token APIs under test and the bridge method each one drives.
const TOKEN_APIS = [
    { name: "acquireTokenSilent", bridge: "GetToken" },
    { name: "ssoSilent", bridge: "GetToken" },
    { name: "acquireTokenPopup", bridge: "GetTokenPopup" },
    { name: "loginPopup", bridge: "GetTokenPopup" },
] as const;

// Excluded from CI by the pipeline testFilter; throws in beforeAll if the broker
// prerequisites are missing when run elsewhere.
const brokerDescribe = describe;

// Resolves the nested app's iframe as a Frame once its buttons are present.
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

// Asserts a nestable-client token store: one id + access token for the scopes,
// and no refresh token (the broker holds it).
function assertNestedTokenStore(store: TokenStore): void {
    expect(store.idTokens.length).toBe(1);
    expect(store.accessTokens.length).toBe(1);
    expect(store.refreshTokens.length).toBe(0);
    expect(accessTokenForScopesExists(store.accessTokens, SCOPES)).toBe(true);
}

brokerDescribe("NAA token APIs brokered through the platform broker", () => {
    jest.setTimeout(300000);

    let broker: BrokerContext;
    let context: BrowserContext;
    let hostPage: Page;
    let nestedFrame: Frame;
    let serverProcess: ChildProcess;

    let username: string;
    let accountPwd: string;

    // Auto-completes any AAD login popup the interactive APIs open.
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
                    await enterAadCredentials(popup, username, accountPwd);
                }
            } catch {
                // Popup closed itself (silent broker completion) — nothing to do.
            }
        });
    }

    beforeAll(async () => {
        // Start the sample from .env (the real broker registrations). The default
        // jest globalSetup may have started the .env.e2e server on these ports, so
        // free them first, then bring up host + nested over HTTPS.
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

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };
        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParams
        );
        [username, accountPwd] = await setupCredentials(
            envResponse[0],
            labClient
        );

        broker = await launchBrokerContext();
        if (!broker.extensionPresent) {
            throw new Error(
                "The Microsoft SSO extension did not force-install into the test " +
                    "profile, so the platform broker is unavailable. This spec must " +
                    "run on a self-hosted, WAM-enabled Windows agent (see brokerHarness.ts)."
            );
        }
        context = broker.context;

        // Sign the host in, filling the credential prompt if one appears.
        hostPage = await context.newPage();
        await hostPage.goto(HOST_URL, { waitUntil: "domcontentloaded" });

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
                await enterAadCredentials(popup, username, accountPwd);
            }
        }

        await hostPage
            .getByText("Signed in as", { exact: false })
            .waitFor({ timeout: ACTION_TIMEOUT });

        // Host signed in through the broker holds no refresh token (the OS broker
        // does); a non-zero count means it fell back to the web flow.
        const hostStore = await readSessionTokenStore(hostPage);
        expect(hostStore.refreshTokens.length).toBe(0);
        expect(hostStore.idTokens.length).toBe(1);
        expect(await readAccountKeys(hostPage)).not.toBeNull();

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

    it.each(TOKEN_APIS)(
        "nested app acquires a token via $name ($bridge) through the broker",
        async ({ name }) => {
            await nestedFrame
                .locator(`#${name}`)
                .click({ timeout: ACTION_TIMEOUT });

            // The nested UI tags the result table with the API that produced it.
            const resultTable = nestedFrame.locator(
                `table[data-testid='lastApi'][data-api='${name}']`
            );
            await resultTable.waitFor({ timeout: ACTION_TIMEOUT });

            expect(await readAccountKeys(nestedFrame)).not.toBeNull();
            const nestedStore = await readSessionTokenStore(nestedFrame);
            assertNestedTokenStore(nestedStore);
        }
    );

    it("nested app rejects acquireTokenRedirect as unsupported", async () => {
        const before = await readSessionTokenStore(nestedFrame);

        await nestedFrame
            .locator("#acquireTokenRedirect")
            .click({ timeout: ACTION_TIMEOUT });

        // The nested UI surfaces the thrown NestedAppAuthError with its code.
        const errorEl = nestedFrame.locator(
            "pre[data-testid='apiError'][data-api='acquireTokenRedirect']"
        );
        await errorEl.waitFor({ timeout: ACTION_TIMEOUT });
        expect(await errorEl.getAttribute("data-error-code")).toBe(
            UNSUPPORTED_METHOD_CODE
        );

        // The rejected call must not mint or drop any tokens.
        const after = await readSessionTokenStore(nestedFrame);
        expect(after.idTokens.length).toBe(before.idTokens.length);
        expect(after.accessTokens.length).toBe(before.accessTokens.length);
        expect(after.refreshTokens.length).toBe(0);
    });
});
