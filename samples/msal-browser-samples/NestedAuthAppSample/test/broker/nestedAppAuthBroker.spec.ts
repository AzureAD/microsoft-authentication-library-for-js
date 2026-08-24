/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Platform-broker (JS-WAM) Nested App Authentication e2e — B1.
 *
 * Exercises EVERY MSAL token API a nestable public client supports, driving each
 * one through the host's NAA bridge to the platform broker:
 *
 *   - acquireTokenSilent / ssoSilent  -> bridge GetToken      (host brokers silently)
 *   - acquireTokenPopup  / loginPopup -> bridge GetTokenPopup (host brokers interactively)
 *
 * (acquireTokenRedirect / loginRedirect / acquireTokenByCode are deliberately
 * unsupported by NestedAppAuthController — they throw — so they are not tested
 * here.)
 *
 * The signature that proves tokens came from the *platform broker* rather than
 * the fallback web flow: the host cache holds NO refresh token (the OS broker
 * holds it), and the nested app — a nestable client — never holds one either.
 *
 * OPT-IN / SELF-HOSTED ONLY. Requires branded Chrome, the force-installed
 * Microsoft SSO extension, WAM, and lab credentials — none of which exist on the
 * hosted CI pool. Guarded behind `NAA_BROKER_E2E=1`; run via
 * `npm run test:e2e:broker`. See `test/broker/brokerHarness.ts` and the README.
 */

import { BrowserContext, Page, Frame } from "playwright";
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
const { HOST_APP_PORT, NESTED_APP_PORT } = require("../../sampleConfig.cjs") as {
    HOST_APP_PORT: number;
    NESTED_APP_PORT: number;
};

const HOST_URL = `https://localhost:${HOST_APP_PORT}`;
const NESTED_IFRAME = "iframe[title='nestedApp']";
const SCOPES = ["User.Read"];
const ACTION_TIMEOUT = 60000;

// The token APIs under test and the bridge method each one drives.
const TOKEN_APIS = [
    { name: "acquireTokenSilent", bridge: "GetToken" },
    { name: "ssoSilent", bridge: "GetToken" },
    { name: "acquireTokenPopup", bridge: "GetTokenPopup" },
    { name: "loginPopup", bridge: "GetTokenPopup" },
] as const;

// Skip the entire suite unless explicitly opted in on a self-hosted WAM agent.
const brokerDescribe = process.env.NAA_BROKER_E2E ? describe : describe.skip;

/**
 * Resolves the nested app's iframe as a Playwright `Frame` (for sessionStorage
 * reads) once it has loaded and its buttons are present.
 */
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

/**
 * Asserts a nestable-client token store: exactly one id + access token covering
 * the requested scopes, an account, and — critically — NO refresh token (the
 * nested app brokers through the host and never holds one).
 */
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

    let username: string;
    let accountPwd: string;

    /**
     * Auto-completes any AAD login popup the interactive APIs open. Once the host
     * is signed in through the broker these popups usually complete silently, but
     * a credential prompt can still appear — fill it so `acquireTokenPopup` /
     * `loginPopup` don't hang.
     */
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
                `The Microsoft SSO extension (${process.env.SSO_EXTENSION_ID ?? "ppnbnpeolgkicgegkbkbjmhlideopiji"}) ` +
                    `did not force-install into the test profile, so the platform broker is unavailable. ` +
                    `This spec must run on a self-hosted, AAD-joined, WAM-enabled Windows agent with branded ` +
                    `Chrome and the extension force-listed (see test/broker/brokerHarness.ts).`
            );
        }
        context = broker.context;

        // Sign the host in. With the broker engaged the popup typically completes
        // without a credential prompt; when a prompt appears we fill it.
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

        // Host signed in through the broker: the OS broker holds the refresh
        // token, so the host cache must hold NONE. A non-zero count here means
        // the request fell back to the web flow and the broker did not engage.
        const hostStore = await readSessionTokenStore(hostPage);
        expect(hostStore.refreshTokens.length).toBe(0);
        expect(hostStore.idTokens.length).toBe(1);
        expect(await readAccountKeys(hostPage)).not.toBeNull();

        // From here on, auto-complete any popup the interactive nested APIs open.
        autoCompleteAadPopups();

        nestedFrame = await getNestedFrame(hostPage);
    });

    afterAll(async () => {
        await closeBrokerContext(broker);
    });

    it.each(TOKEN_APIS)(
        "nested app acquires a token via $name ($bridge) through the broker",
        async ({ name }) => {
            // Trigger this specific token API in the nested app.
            await nestedFrame
                .locator(`#${name}`)
                .click({ timeout: ACTION_TIMEOUT });

            // The nested UI renders the account table tagged with the API that
            // produced it once the brokered token comes back.
            const resultTable = nestedFrame.locator(
                `table[data-testid='lastApi'][data-api='${name}']`
            );
            await resultTable.waitFor({ timeout: ACTION_TIMEOUT });

            // The nested app must have an account and a fresh token, and — proving
            // the brokered path — must hold no refresh token of its own.
            expect(await readAccountKeys(nestedFrame)).not.toBeNull();
            const nestedStore = await readSessionTokenStore(nestedFrame);
            assertNestedTokenStore(nestedStore);
        }
    );
});
