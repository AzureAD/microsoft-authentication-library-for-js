import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as puppeteer from "puppeteer";
import { InteractionType } from "@azure/msal-browser";
import {
    Screenshot,
    BrowserCacheUtils,
    createPlatformBrokerProfile,
    launchPlatformBrokerBrowser,
    observePopupEarRequests,
    PLATFORM_LOGIN_TIMEOUT,
    PlatformBrokerProfile,
    removePlatformBrokerProfile,
    verifyPlatformBrokerAccount,
    verifyPlatformBrokerOperation,
    verifyPlatformBrokerRedirect,
    verifyPlatformBrokerTokenStore,
} from "e2e-test-utils";
import { AuthenticationFlowTestUtils } from "./AuthenticationFlowTestUtils";

// CommonJS helper; require by relative path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/earPlatformBroker`;

// EAR runs on its own HTTPS server + cert-tolerant browser; shared http
// harness (port 3000) untouched.
const EAR_PORT = 3443;
// npm resolves the sample's env-cmd dependency and loads .env.ear.e2e.
const EAR_START_CMD = "npm run start:ear:e2e";
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");

// Enable both EAR protocol and the platform broker for this suite.
const EAR_QUERY_STRING = "?ear=true&platformBroker=true";
const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
const EAR_CRYPTO_ALGORITHM = "AES-GCM";

// Platform-broker EAR tests are local-only: they need the MS SSO extension,
// native host and a brokerable signed-in Windows account, none of which exist
// in ADO/prod CI. This whole spec is excluded from CI by the `ear-basic`
// testFilter in the pipeline; run it locally by pointing SSO_EXTENSION_PATH at
// the unpacked "Microsoft Single Sign On" extension directory.
describe("EAR + Platform Broker Tests", () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let flowUtils: AuthenticationFlowTestUtils;
    let earServerProcess: ChildProcess;
    let profile: PlatformBrokerProfile;

    beforeAll(async () => {
        profile = createPlatformBrokerProfile();

        earServerProcess = spawn(EAR_START_CMD, {
            shell: true,
            cwd: EXPRESS_SAMPLE_ROOT,
            stdio: ["ignore", "inherit", "inherit"],
        });
        const serverUp = await serverUtils.isServerUp(EAR_PORT, 60000);
        if (!serverUp) {
            throw new Error(
                `EAR https server did not come up on port ${EAR_PORT}`
            );
        }

        browser = await launchPlatformBrokerBrowser(profile);
    });

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
        await serverUtils.killServer(EAR_PORT);
        await new Promise<void>((resolve) => {
            if (!earServerProcess || earServerProcess.exitCode !== null) {
                resolve();
                return;
            }
            earServerProcess.once("exit", () => resolve());
            earServerProcess.kill();
            setTimeout(() => resolve(), 5000);
        });
        removePlatformBrokerProfile(profile);
    });

    beforeEach(async () => {
        // Use the default context: an extension loaded via --load-extension is
        // not enabled in additional (incognito) contexts.
        page = await browser.newPage();
        BrowserCache = new BrowserCacheUtils(page, EAR_CACHE_LOCATION);
        flowUtils = new AuthenticationFlowTestUtils(page);
        await flowUtils.installCryptoOperationSpy(
            EAR_ORIGIN,
            EAR_CRYPTO_ALGORITHM
        );
        await page.goto(`https://localhost:${EAR_PORT}/${EAR_QUERY_STRING}`, {
            timeout: 10000,
        });
        await flowUtils.assertCryptoOperationSpyInstalled(EAR_CRYPTO_ALGORITHM);
    });

    afterEach(async () => {
        await page.evaluate(() => window.sessionStorage.clear());
        await page.evaluate(() => window.localStorage.clear());
        await page.close();
    });

    it("Performs EAR + platform broker loginRedirect", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPlatformRedirect`
        );

        // The SSO extension signs in the Windows account (no password prompt).
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        // EAR still POSTs /authorize; ear_jwe is decrypted to extract accountId.
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        const signInResult = await verifyPlatformBrokerRedirect(page);
        expect(await verifyPlatformBrokerAccount(page)).toEqual({
            homeAccountId: signInResult.homeAccountId,
            nativeAccountId: signInResult.nativeAccountId,
        });
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker loginPopup", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPlatformPopup`
        );

        await page.locator("button#signInButton").click();
        let authorizeRequests = 0;
        const signInResult = await verifyPlatformBrokerOperation(
            page,
            InteractionType.Popup,
            async () => {
                authorizeRequests = await observePopupEarRequests(
                    page,
                    async () => {
                        await page.locator("a#signInPopup").click();
                        await page.waitForSelector("a#viewProfileButton", {
                            visible: true,
                            timeout: PLATFORM_LOGIN_TIMEOUT,
                        });
                    }
                );
            }
        );
        await screenshot.takeScreenshot(page, "Logged In");

        expect(authorizeRequests).toBeGreaterThan(0);
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        expect(await verifyPlatformBrokerAccount(page)).toEqual({
            homeAccountId: signInResult.homeAccountId,
            nativeAccountId: signInResult.nativeAccountId,
        });
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker ssoSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPlatformSsoSilent`
        );

        // Seed an interactive login to establish the account/session.
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });

        const signInResult = await verifyPlatformBrokerRedirect(page);
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        const authorizeCount = flowUtils.getRequestCount("/authorize");
        const tokenCount = flowUtils.getRequestCount("/token");
        const silentResult = await verifyPlatformBrokerOperation(
            page,
            InteractionType.Silent,
            async () => {
                await page.locator("button#ssoSilentButton").click();
                await page.waitForSelector(
                    'div#silentStatus[data-status="ssoSilent:success"]',
                    { timeout: 30000 }
                );
            }
        );
        await screenshot.takeScreenshot(page, "ssoSilent completed");

        // A broker-linked silent call can use native memory without another EAR response.
        expect(silentResult.nativeAccountId).toBe(signInResult.nativeAccountId);
        expect(silentResult.homeAccountId).toBe(signInResult.homeAccountId);
        expect(flowUtils.getRequestCount("/authorize")).toBe(authorizeCount);
        expect(flowUtils.getRequestCount("/token")).toBe(tokenCount);
        expect(await verifyPlatformBrokerAccount(page)).toEqual({
            homeAccountId: signInResult.homeAccountId,
            nativeAccountId: signInResult.nativeAccountId,
        });
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker acquireTokenSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPlatformAcquireTokenSilent`
        );

        // Seed an interactive login.
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });

        const signInResult = await verifyPlatformBrokerRedirect(page);
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        const authorizeCount = flowUtils.getRequestCount("/authorize");
        const tokenCount = flowUtils.getRequestCount("/token");
        const silentResult = await verifyPlatformBrokerOperation(
            page,
            InteractionType.Silent,
            async () => {
                await page.locator("button#acquireTokenSilentButton").click();
                await page.waitForSelector(
                    'div#silentStatus[data-status="acquireTokenSilent:success"]',
                    { timeout: 30000 }
                );
            }
        );
        await screenshot.takeScreenshot(page, "acquireTokenSilent completed");

        expect(silentResult.nativeAccountId).toBe(signInResult.nativeAccountId);
        expect(silentResult.homeAccountId).toBe(signInResult.homeAccountId);
        expect(flowUtils.getRequestCount("/authorize")).toBe(authorizeCount);
        expect(flowUtils.getRequestCount("/token")).toBe(tokenCount);
        expect(await verifyPlatformBrokerAccount(page)).toEqual({
            homeAccountId: signInResult.homeAccountId,
            nativeAccountId: signInResult.nativeAccountId,
        });
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });
});
