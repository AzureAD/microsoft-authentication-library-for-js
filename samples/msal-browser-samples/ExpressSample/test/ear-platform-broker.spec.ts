import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { spawn, ChildProcess } from "child_process";
import * as puppeteer from "puppeteer";
import { Screenshot, BrowserCacheUtils } from "e2e-test-utils";

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

// ?ear=true forces EAR protocol (see earConfig.js).
const EAR_QUERY_STRING = "?ear=true";
const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
// sessionStorage key for the decrypt spy count.
const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

// Unpacked "Microsoft Single Sign On" extension dir (id ppnbnpeolgkicgegkbkbjmhlideopiji).
const SSO_EXTENSION_PATH = process.env.SSO_EXTENSION_PATH || "";
// The platform broker writes this storage key only on the broker path.
const MATS_TELEMETRY_KEY = "mats-telemetry-profile-id";
// The SSO extension can take a while to complete sign-in.
const PLATFORM_LOGIN_TIMEOUT = 180000;

/** True when /authorize used POST (EAR posts the encrypted JWK). */
function isAuthorizePost(request: puppeteer.HTTPRequest): boolean {
    return request.url().includes("/authorize") && request.method() === "POST";
}

/** AES-GCM decrypt count; non-zero proves the EAR response was decrypted. */
async function getEarDecryptCount(target: puppeteer.Page): Promise<number> {
    return target.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
}

/** Installs the AES-GCM decrypt spy on every same-origin document. */
async function installEarDecryptSpy(target: puppeteer.Page): Promise<void> {
    await target.evaluateOnNewDocument(
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
                                    window.sessionStorage.getItem(config.key) ||
                                        "0",
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
}

/** True when the platform-broker path wrote its telemetry profile id. */
async function getHasMatsTelemetryProfileId(
    target: puppeteer.Page
): Promise<boolean> {
    return target.evaluate(
        (key) => window.sessionStorage.getItem(key) !== null,
        MATS_TELEMETRY_KEY
    );
}

/**
 * Platform-broker cache shape: the broker keeps the access token in native
 * in-memory storage and no refresh token is browser-cached, so only the id
 * token and account land in browser storage.
 */
async function verifyPlatformBrokerTokenStore(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(0);
    expect(tokenStore.refreshTokens.length).toBe(0);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
}

// Platform-broker EAR tests are local-only: they need the MS SSO extension,
// native host and a brokerable signed-in Windows account, none of which exist
// in ADO/prod CI. This whole spec is excluded from CI by the `ear-basic`
// testFilter in the pipeline; run it locally by pointing SSO_EXTENSION_PATH at
// the unpacked "Microsoft Single Sign On" extension directory.
describe("EAR + Platform Broker Tests", () => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let earServerProcess: ChildProcess;
    let extensionDir = "";

    beforeAll(async () => {
        if (!SSO_EXTENSION_PATH) {
            throw new Error(
                "SSO_EXTENSION_PATH must point to the unpacked Microsoft SSO extension"
            );
        }
        // Copy the extension out of any live browser profile before loading it.
        extensionDir = fs.mkdtempSync(path.join(os.tmpdir(), "sso-ext-"));
        fs.cpSync(SSO_EXTENSION_PATH, extensionDir, { recursive: true });

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

        // Bundled Chrome for Testing (NOT channel:chrome — Chrome 137+ blocks
        // --load-extension). The native host must also be registered for it.
        browser = await puppeteer.launch({
            headless: false,
            acceptInsecureCerts: true,
            timeout: 60000,
            args: [
                "--disable-features=DisableLoadExtensionCommandLineSwitch",
                `--disable-extensions-except=${extensionDir}`,
                `--load-extension=${extensionDir}`,
            ],
        });
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
        if (extensionDir) {
            fs.rmSync(extensionDir, { recursive: true, force: true });
        }
    });

    beforeEach(async () => {
        // Use the default context: an extension loaded via --load-extension is
        // not enabled in additional (incognito) contexts.
        page = await browser.newPage();
        BrowserCache = new BrowserCacheUtils(page, EAR_CACHE_LOCATION);
        await installEarDecryptSpy(page);
        await page.goto(`https://localhost:${EAR_PORT}/${EAR_QUERY_STRING}`, {
            timeout: 10000,
        });
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

        let authorizeWasPost = false;
        page.on("request", (request) => {
            if (isAuthorizePost(request)) {
                authorizeWasPost = true;
            }
        });

        // The SSO extension signs in the Windows account (no password prompt).
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        // EAR still POSTs /authorize; ear_jwe is decrypted to extract accountId.
        expect(authorizeWasPost).toBe(true);
        expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
        // Only the platform-broker path sets this; the web flow does not.
        expect(await getHasMatsTelemetryProfileId(page)).toBe(true);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker loginPopup", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/earPlatformPopup`
        );

        await page.locator("button#signInButton").click();
        const newPopupWindowPromise = new Promise<puppeteer.Page | null>(
            (resolve) => page.once("popup", resolve)
        );
        await page.locator("a#signInPopup").click();

        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        let authorizeWasPost = false;
        popupPage.on("request", (request) => {
            if (isAuthorizePost(request)) {
                authorizeWasPost = true;
            }
        });

        // The SSO extension completes the popup sign-in for the Windows account.
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        expect(authorizeWasPost).toBe(true);
        expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
        expect(await getHasMatsTelemetryProfileId(page)).toBe(true);
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

        const decryptCountBefore = await getEarDecryptCount(page);

        await page.locator("button#ssoSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="ssoSilent:success"]',
            { timeout: 30000 }
        );
        await screenshot.takeScreenshot(page, "ssoSilent completed");

        // Silent EAR authorize re-runs; the platform broker services it again.
        expect(await getEarDecryptCount(page)).toBeGreaterThan(
            decryptCountBefore
        );
        expect(await getHasMatsTelemetryProfileId(page)).toBe(true);
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

        await page.locator("button#acquireTokenSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="acquireTokenSilent:success"]',
            { timeout: 30000 }
        );
        await screenshot.takeScreenshot(page, "acquireTokenSilent completed");

        // Platform accounts renew through the broker, not the EAR RT grant.
        expect(await getHasMatsTelemetryProfileId(page)).toBe(true);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });
});
