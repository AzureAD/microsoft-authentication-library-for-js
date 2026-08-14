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

// CommonJS helper; require by relative path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/browserEAR`;

// EAR runs on its own HTTPS server + cert-tolerant browser; shared http
// harness (port 3000) untouched.
const EAR_PORT = 3443;
// env-cmd loads .env.ear.e2e (HTTPS, port 3443, EAR config).
const EAR_START_CMD = "env-cmd -f .env.ear.e2e npm start";
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");

// ?ear=true forces EAR protocol (see earConfig.js).
const EAR_QUERY_STRING = "?ear=true";
const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_SCOPES = ["User.Read"];
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
// sessionStorage key for the decrypt spy count.
const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

/** True when /authorize used POST (EAR posts the encrypted JWK). */
function isAuthorizePost(request: puppeteer.HTTPRequest): boolean {
    return request.url().includes("/authorize") && request.method() === "POST";
}

/** True when a POST hit /token (token refresh). */
function isTokenPost(request: puppeteer.HTTPRequest): boolean {
    return request.url().includes("/token") && request.method() === "POST";
}

/** AES-GCM decrypt count; non-zero proves the EAR response was decrypted. */
async function getEarDecryptCount(target: puppeteer.Page): Promise<number> {
    return target.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}

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

describe("EAR (Encrypted Authorize Response) Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let username = "";
    let accountPwd = "";
    let BrowserCache: BrowserCacheUtils;
    let earServerProcess: ChildProcess;

    beforeAll(async () => {
        // Dedicated EAR HTTPS server; spawn directly (not serverUtils) and
        // inherit stdio so server logs surface. afterAll awaits child exit.
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
        // WebCrypto decrypt spy, re-applied on every same-origin document.
        // Origin guard keeps it off ESTS; count kept in sessionStorage.
        await page.evaluateOnNewDocument(
            (config: { origin: string; key: string }) => {
                try {
                    if (window.location.origin !== config.origin) {
                        return;
                    }
                    if (!window.crypto || !window.crypto.subtle) {
                        return;
                    }
                    const realDecrypt = window.crypto.subtle.decrypt.bind(
                        window.crypto.subtle
                    );
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    (window.crypto.subtle as any).decrypt = function (
                        algorithm: AlgorithmIdentifier,
                        key: CryptoKey,
                        data: BufferSource
                    ) {
                        const algName =
                            typeof algorithm === "string"
                                ? algorithm
                                : algorithm.name;
                        if (algName === "AES-GCM") {
                            try {
                                const next =
                                    parseInt(
                                        window.sessionStorage.getItem(
                                            config.key
                                        ) || "0",
                                        10
                                    ) + 1;
                                window.sessionStorage.setItem(
                                    config.key,
                                    String(next)
                                );
                            } catch (e) {
                                // ignore storage errors
                            }
                        }
                        return realDecrypt(algorithm, key, data);
                    };
                } catch (e) {
                    // best-effort spy: never break the auth flow
                }
            },
            { origin: EAR_ORIGIN, key: EAR_DECRYPT_COUNT_KEY }
        );
        await page.goto(`https://localhost:${EAR_PORT}/${EAR_QUERY_STRING}`, {
            timeout: 10000,
        });
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

        // EAR posts /authorize; capture the method to assert the protocol.
        let authorizeWasPost = false;
        page.on("request", (request) => {
            if (isAuthorizePost(request)) {
                authorizeWasPost = true;
            }
        });

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

        expect(authorizeWasPost).toBe(true);
        // MSAL decrypted the EAR response (ear_jwe), not an auth-code fallback.
        expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
        // Cache has Account, idToken, AccessToken, RefreshToken (RT inline via EAR).
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });

    it("Performs EAR loginPopup", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPopupBaseCase`
        );
        await screenshot.takeScreenshot(page, "Page loaded");

        await page.locator("button#signInButton").click();

        const newPopupWindowPromise = new Promise<puppeteer.Page | null>(
            (resolve) => page.once("popup", resolve)
        );
        await page.locator("a#signInPopup").click();
        await screenshot.takeScreenshot(page, "Sign in popup clicked");

        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        // EAR posts /authorize from the popup window; attach before creds.
        let authorizeWasPost = false;
        popupPage.on("request", (request) => {
            if (isAuthorizePost(request)) {
                authorizeWasPost = true;
            }
        });

        await enterCredentials(popupPage, screenshot, username, accountPwd);

        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: 30000,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        // POST /authorize -> EAR flow was used, not auth-code GET.
        expect(authorizeWasPost).toBe(true);
        // MSAL decrypted the EAR response (ear_jwe) in this window.
        expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
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

        // ssoSilent runs a hidden-iframe authorize; EAR POSTs /authorize + decrypts.
        let ssoAuthorizeWasPost = false;
        page.on("request", (request) => {
            if (isAuthorizePost(request)) {
                ssoAuthorizeWasPost = true;
            }
        });
        const decryptCountBefore = await getEarDecryptCount(page);

        await page.locator("button#ssoSilentButton").click();
        await page.waitForSelector("div#silentStatus[data-status=\"ssoSilent:success\"]", {
            timeout: 30000,
        });
        await screenshot.takeScreenshot(page, "ssoSilent completed");

        // Silent EAR authorize used POST /authorize (not an auth-code GET).
        expect(ssoAuthorizeWasPost).toBe(true);
        // A new ear_jwe was decrypted during the silent authorize.
        expect(await getEarDecryptCount(page)).toBeGreaterThan(decryptCountBefore);
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
        let tokenWasPost = false;
        let authorizeWasPost = false;
        page.on("request", (request) => {
            if (isTokenPost(request)) {
                tokenWasPost = true;
            }
            if (isAuthorizePost(request)) {
                authorizeWasPost = true;
            }
        });
        const decryptCountBefore = await getEarDecryptCount(page);

        await page.locator("button#acquireTokenSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="acquireTokenSilent:success"]',
            { timeout: 30000 }
        );
        await screenshot.takeScreenshot(page, "acquireTokenSilent completed");

        // RT -> AT exchange happened over /token.
        expect(tokenWasPost).toBe(true);
        // No new EAR authorize and no new decrypt: the RT grant was used, not EAR.
        expect(authorizeWasPost).toBe(false);
        expect(await getEarDecryptCount(page)).toBe(decryptCountBefore);
        // Token store still holds a full EAR token set after the silent renewal.
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });
});
