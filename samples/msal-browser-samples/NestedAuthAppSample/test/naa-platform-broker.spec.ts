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
// Two suites are generated from one factory:
//   1. the standard NAA + platform-broker flow, and
//   2. the NAA + Encrypted Authorize Response (EAR) combination, where the host
//      runs in `ProtocolMode.EAR` (opened with `?ear=true`) so its login and the
//      tokens it brokers for the nested app come back as an encrypted `ear_jwe`.
//
// Self-hosted only: requires branded Chrome, the Microsoft SSO extension, WAM,
// and lab credentials, so it is excluded from CI by the `naa-basic` testFilter
// in the e2e pipeline. Run locally via `npm run test:e2e:broker` (both suites)
// or `npm run test:e2e:ear-broker` (EAR suite only).

import { BrowserContext, Page, Frame } from "playwright-core";
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
    installEarDecryptSpy,
    getEarDecryptCount,
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

// Resets the nested app to a pristine state before each case: clears its MSAL
// cache and reloads the iframe so the nested PCA re-initializes with an empty
// token cache. Without this the cases share one nested cache, so a cache-first
// API (e.g. ssoSilent after acquireTokenSilent) would be served the token a
// previous case cached and never issue its own bridge request. The account
// context is restored from the host bridge on reload, so every API still
// resolves — but only by genuinely exercising its bridge path.
async function resetNestedFrame(hostPage: Page): Promise<Frame> {
    const frame = await getNestedFrame(hostPage);
    await frame.evaluate(() => window.sessionStorage.clear());
    await hostPage.evaluate((selector) => {
        const iframe = document.querySelector(
            selector
        ) as HTMLIFrameElement | null;
        if (iframe) {
            // Re-assigning src (even to the same URL) reloads the iframe.
            // eslint-disable-next-line no-self-assign
            iframe.src = iframe.src;
        }
    }, NESTED_IFRAME);
    return getNestedFrame(hostPage);
}

// Asserts a nestable-client token store: one id + access token for the scopes,
// and no refresh token (the broker holds it).
function assertNestedTokenStore(store: TokenStore): void {
    expect(store.idTokens.length).toBe(1);
    expect(store.accessTokens.length).toBe(1);
    expect(store.refreshTokens.length).toBe(0);
    expect(accessTokenForScopesExists(store.accessTokens, SCOPES)).toBe(true);
}

// Generates a brokered-NAA suite. `ear` opens the host in ProtocolMode.EAR
// (`?ear=true`) and additionally asserts an `ear_jwe` was decrypted, proving the
// brokered tokens travelled over the Encrypted Authorize Response protocol.
function runBrokeredNaaSuite(title: string, ear: boolean): void {
    describe(title, () => {
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
            // Start the sample from .env (the real broker registrations). The
            // default jest globalSetup may have started the .env.e2e server on
            // these ports, so free them first, then bring up host + nested over
            // HTTPS.
            await serverUtils.killServer(HOST_APP_PORT);
            await serverUtils.killServer(NESTED_APP_PORT);
            serverProcess = spawn("node server.js --https", {
                shell: true,
                cwd: SAMPLE_ROOT,
                stdio: ["ignore", "inherit", "inherit"],
            });
            const [hostUp, nestedUp] = await Promise.all([
                serverUtils.isServerUp(HOST_APP_PORT, SERVER_READY_TIMEOUT_MS),
                serverUtils.isServerUp(
                    NESTED_APP_PORT,
                    SERVER_READY_TIMEOUT_MS
                ),
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

            // In EAR mode, install the decrypt spy before any page loads so it is
            // present when MSAL processes the encrypted authorize response.
            if (ear) {
                await installEarDecryptSpy(context);
            }

            // Sign the host in, filling the credential prompt if one appears. In
            // EAR mode the host is opened with `?ear=true` so it runs
            // ProtocolMode.EAR and threads the flag onto the nested iframe.
            hostPage = await context.newPage();
            await hostPage.goto(ear ? `${HOST_URL}/?ear=true` : HOST_URL, {
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
                    await enterAadCredentials(popup, username, accountPwd);
                }
            }

            await hostPage
                .getByText("Signed in as", { exact: false })
                .waitFor({ timeout: ACTION_TIMEOUT });

            // Host signed in through the broker holds no refresh token (the OS
            // broker does); a non-zero count means it fell back to the web flow.
            const hostStore = await readSessionTokenStore(hostPage);
            expect(hostStore.refreshTokens.length).toBe(0);
            expect(hostStore.idTokens.length).toBe(1);
            expect(await readAccountKeys(hostPage)).not.toBeNull();

            // EAR host login must have decrypted an `ear_jwe`; a zero count means
            // the host silently fell back to a plaintext auth-code response.
            if (ear) {
                expect(await getEarDecryptCount(hostPage)).toBeGreaterThan(0);
            }

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

        // Reset the nested cache before every case so each API exercises its own
        // bridge path instead of being served a token a prior case cached.
        beforeEach(async () => {
            nestedFrame = await resetNestedFrame(hostPage);
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

                // With EAR on, the host must still be on the EAR protocol — a
                // decrypt has happened (host login at minimum) and no plaintext
                // fallback reset it to zero.
                if (ear) {
                    expect(await getEarDecryptCount(hostPage)).toBeGreaterThan(
                        0
                    );
                }
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
}

runBrokeredNaaSuite(
    "NAA token APIs brokered through the platform broker",
    false
);
runBrokeredNaaSuite(
    "NAA token APIs + EAR brokered through the platform broker",
    true
);
