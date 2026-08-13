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

// CommonJS helper, not a package export -> require by relative path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/browserEAR`;

// Approach B: EAR runs on its own isolated HTTPS server + cert-tolerant browser.
// https is required for future platform-broker/WAM injection. The shared jest
// harness (http, port 3000) is left untouched.
const EAR_PORT = 3443;
// env-cmd loads .env.ear.e2e (HTTPS=true, PORT=3443, EAR config); server.js makes
// an in-memory self-signed cert.
const EAR_START_CMD = "env-cmd -f .env.ear.e2e npm start";
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");

// Mirrors public/js/earConfig.js; ?ear=true applies it and forces protocolMode "EAR".
const EAR_QUERY_STRING = "?ear=true";
const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_SCOPES = ["User.Read"];
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
// sessionStorage key for the decrypt spy count; survives the redirect round-trip.
const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

/**
 * True when the /authorize request used POST. EAR posts the encrypted JWK in the
 * body, so this distinguishes EAR from the default auth-code GET.
 */
function isAuthorizePost(request: puppeteer.HTTPRequest): boolean {
    return request.url().includes("/authorize") && request.method() === "POST";
}

/**
 * AES-GCM WebCrypto decrypt count. In the EAR sessionStorage config the only such
 * call is decryptEarResponse, so a non-zero count proves the ear_jwe was decrypted.
 */
async function getEarDecryptCount(target: puppeteer.Page): Promise<number> {
    return target.evaluate(
        (key) => parseInt(window.sessionStorage.getItem(key) || "0", 10),
        EAR_DECRYPT_COUNT_KEY
    );
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
        // Start a dedicated HTTPS server for EAR and a cert-tolerant browser,
        // leaving the shared http harness (port 3000) untouched. Spawn directly
        // with stdio "ignore" instead of serverUtils.startServer: that helper's
        // stdout/stderr/close handlers log after teardown ("Cannot log after
        // tests are done") and make jest exit non-zero despite passing tests.
        earServerProcess = spawn(EAR_START_CMD, {
            shell: true,
            cwd: EXPRESS_SAMPLE_ROOT,
            stdio: "ignore",
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
        // Install a WebCrypto decrypt spy on every same-origin document before
        // navigating. evaluateOnNewDocument re-applies across the redirect
        // round-trip, the origin guard keeps it off ESTS, and the count is kept
        // in sessionStorage to read after the flow.
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

        // EAR posts /authorize from the popup window, so listen there. Attach
        // before entering credentials so the navigation is captured.
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
});
