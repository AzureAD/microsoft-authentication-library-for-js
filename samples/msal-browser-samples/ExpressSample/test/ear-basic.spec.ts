import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    LabClient,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    BrowserCacheUtils,
} from "e2e-test-utils";
import { AuthenticationFlowTestUtils } from "./AuthenticationFlowTestUtils";

// CommonJS helper; require by relative path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/earBasic`;

// EAR runs on its own HTTPS server + cert-tolerant browser; shared http
// harness (port 3000) untouched.
const EAR_PORT = 3443;
// npm resolves the sample's env-cmd dependency and loads .env.ear.e2e.
const EAR_START_CMD = "npm run start:ear:e2e";
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");

// ?ear=true forces EAR protocol (see earConfig.js).
const EAR_QUERY_STRING = "?ear=true";
const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_SCOPES = ["User.Read"];
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
const EAR_CRYPTO_ALGORITHM = "AES-GCM";

/** Interactive EAR redirect login; seeds session + cache for the silent tests. */
async function performRedirectLogin(
    page: puppeteer.Page,
    screenshot: Screenshot,
    username: string,
    accountPwd: string
): Promise<void> {
    await page.locator("button#signInButton").click();
    await page.locator("a#signInRedirect").click();
    await screenshot.takeScreenshot(page, "Sign in redirect clicked");
    await enterCredentials(page, screenshot, username, accountPwd);
    await page.waitForSelector("a#viewProfileButton", {
        visible: true,
        timeout: 30000,
    });
    await screenshot.takeScreenshot(page, "Logged In");
}

describe("EAR Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let username = "";
    let accountPwd = "";
    let BrowserCache: BrowserCacheUtils;
    let flowUtils: AuthenticationFlowTestUtils;
    let earServerProcess: ChildProcess;

    beforeAll(async () => {
        // Dedicated EAR HTTPS server; spawn directly and inherit stdio so
        // server logs surface. afterAll awaits child exit.
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

        browser = await puppeteer.launch({
            headless: true,
            acceptInsecureCerts: true, // trust in-memory self-signed cert
            timeout: 60000,
        });

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
    });

    afterAll(async () => {
        await browser.close();
        // Kill the EAR server, then await the wrapper exit so no async output
        // races jest teardown.
        await serverUtils.killServer(EAR_PORT);
        await new Promise<void>((resolve) => {
            if (!earServerProcess || earServerProcess.exitCode !== null) {
                resolve();
                return;
            }
            const done = () => resolve();
            earServerProcess.once("exit", done);
            earServerProcess.kill();
            setTimeout(done, 5000);
        });
    });

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
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
        await context.close();
    });

    it("Performs EAR loginRedirect", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earRedirectBaseCase`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await screenshot.takeScreenshot(page, "Sign in redirect clicked");

        await enterCredentials(page, screenshot, username, accountPwd);

        // Profile button only shows once login completes -> reliable signal.
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: 30000,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        // MSAL decrypted the EAR response (ear_jwe), not an auth-code fallback.
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        // Cache has Account, idToken, AccessToken, RefreshToken (RT inline via EAR).
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });

    it("Performs EAR loginPopup", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPopupBaseCase`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        await page.locator("button#signInButton").click();

        let popupFlowUtils: AuthenticationFlowTestUtils | undefined;
        const newPopupWindowPromise = new Promise<puppeteer.Page | null>(
            (resolve) =>
                page.once("popup", (popupPage) => {
                    if (popupPage) {
                        popupFlowUtils = new AuthenticationFlowTestUtils(
                            popupPage
                        );
                    }
                    resolve(popupPage);
                })
        );
        await page.locator("a#signInPopup").click();
        await screenshot.takeScreenshot(page, "Sign in popup clicked");

        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        await enterCredentials(popupPage, screenshot, username, accountPwd);

        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: 30000,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        // POST /authorize -> EAR flow was used, not auth-code GET.
        expect(
            popupFlowUtils?.getRequestCount("/authorize", "POST")
        ).toBeGreaterThan(0);
        // MSAL decrypted the EAR response (ear_jwe) in this window.
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        // Cache has Account, idToken, AccessToken, RefreshToken (RT inline via EAR).
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });

    it("Performs EAR ssoSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earSsoSilentBaseCase`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        // Seed an interactive EAR login so ssoSilent has an ESTS session + account.
        await performRedirectLogin(page, screenshot, username, accountPwd);

        const authorizeCountBefore = flowUtils.getRequestCount(
            "/authorize",
            "POST"
        );
        const decryptCountBefore = await flowUtils.getCryptoOperationCount(
            EAR_CRYPTO_ALGORITHM
        );

        await page.locator("button#ssoSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="ssoSilent:success"]',
            {
                timeout: 30000,
            }
        );
        await screenshot.takeScreenshot(page, "ssoSilent completed");

        // Silent EAR authorize used POST /authorize (not an auth-code GET).
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            authorizeCountBefore
        );
        // A new ear_jwe was decrypted during the silent authorize.
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(decryptCountBefore);
        // Token store still holds a full EAR token set after the silent renewal.
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });

    it("Performs EAR acquireTokenSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earAcquireTokenSilentBaseCase`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        // Seed an interactive EAR login so the EAR-issued refresh token is cached.
        await performRedirectLogin(page, screenshot, username, accountPwd);

        // acquireTokenSilent(forceRefresh) renews the AT from the cached RT via
        // /token POST; no new /authorize or decrypt.
        const tokenCountBefore = flowUtils.getRequestCount("/token", "POST");
        const authorizeCountBefore = flowUtils.getRequestCount(
            "/authorize",
            "POST"
        );
        const decryptCountBefore = await flowUtils.getCryptoOperationCount(
            EAR_CRYPTO_ALGORITHM
        );

        await page.locator("button#acquireTokenSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="acquireTokenSilent:success"]',
            { timeout: 30000 }
        );
        await screenshot.takeScreenshot(page, "acquireTokenSilent completed");

        // RT -> AT exchange happened over /token.
        expect(flowUtils.getRequestCount("/token", "POST")).toBeGreaterThan(
            tokenCountBefore
        );
        // No new EAR authorize and no new decrypt: the RT grant was used, not EAR.
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBe(
            authorizeCountBefore
        );
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBe(decryptCountBefore);
        // Token store still holds a full EAR token set after the silent renewal.
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });
});
