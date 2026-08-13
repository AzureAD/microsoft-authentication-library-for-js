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

// serverUtils is a plain CommonJS helper (not a package export), so require it
// by relative path.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const serverUtils = require("../../../e2eTestUtils/jest-puppeteer-utils/serverUtils");

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/browserEAR`;

// The EAR e2e runs on its own isolated HTTPS server + browser (Approach B). A
// secure origin is required for upcoming platform-broker / WAM extension
// scenarios, which only inject on https origins. The rest of the ExpressSample
// e2e (started by the shared jest harness on port 3000) stays on http, so this
// spec spins up its own dedicated https server and cert-tolerant browser rather
// than touching the shared puppeteer environment.
const EAR_PORT = 3443;
// env-cmd loads .env.ear.e2e (HTTPS=true, PORT=3443, EAR app config); server.js
// then generates an in-memory self-signed localhost cert for the https origin.
const EAR_START_CMD = "env-cmd -f .env.ear.e2e npm start";
const EXPRESS_SAMPLE_ROOT = path.join(__dirname, "..");

// These mirror the separate EAR flow config in public/js/earConfig.js. The
// ?ear=true toggle (see public/js/authConfig.js) applies that config and forces
// system.protocolMode = "EAR" so the sample exercises the Encrypted Authorize
// Response flow.
const EAR_QUERY_STRING = "?ear=true";
const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_SCOPES = ["User.Read"];
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
// sessionStorage key used by the WebCrypto decrypt spy (installed per-document in
// beforeEach). sessionStorage survives the same-origin redirect round-trip to
// ESTS and back, so the count is readable after both the popup and redirect
// flows complete.
const EAR_DECRYPT_COUNT_KEY = "__earDecryptCount";

/**
 * Returns true when a request to the /authorize endpoint used HTTP POST. EAR
 * forces the /authorize request to be a POST form (the encrypted JWK travels in
 * the body), so this is the distinguishing signal of an EAR flow versus the
 * default auth-code GET navigation.
 */
function isAuthorizePost(request: puppeteer.HTTPRequest): boolean {
    return request.url().includes("/authorize") && request.method() === "POST";
}

/**
 * Reads how many times MSAL invoked an AES-GCM WebCrypto decrypt in the sample
 * origin. In the EAR sessionStorage config the only AES-GCM subtle.decrypt call
 * is decryptEarResponse, so a non-zero count proves MSAL decrypted the ear_jwe
 * response rather than falling back to a non-EAR auth-code flow.
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
        // Approach B: start a dedicated HTTPS server for the EAR flow and launch
        // our own browser that tolerates the in-memory self-signed cert. This
        // keeps the shared jest-puppeteer harness (http, port 3000) untouched.
        //
        // Spawn the server directly with stdio "ignore" rather than via
        // serverUtils.startServer: that helper attaches stdout/stderr/close
        // console handlers which, when the server is killed in afterAll, log
        // after the suite has torn down ("Cannot log after tests are done") and
        // make jest exit non-zero even though every test passed.
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
            acceptInsecureCerts: true, // trust the in-memory self-signed localhost cert
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
        // Kill the node process listening on the EAR port, then wait for the
        // spawned wrapper to exit so no async output races jest teardown.
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
        // navigating. evaluateOnNewDocument re-applies on each navigation (so it
        // survives the redirect round-trip to ESTS and back), the origin guard
        // keeps it off the ESTS pages, and the count is persisted in
        // sessionStorage so it can be read after the flow completes.
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
                                // ignore storage access issues
                            }
                        }
                        return realDecrypt(algorithm, key, data);
                    };
                } catch (e) {
                    // best-effort spy: must never break the auth flow
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

        // EAR forces the /authorize request to be a POST form. Capture the
        // method to assert the encrypted-response protocol was actually used.
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

        // The auth-required home content (and its profile button) is only made
        // visible once login completes, so this is a reliable "logged in" signal.
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: 30000,
        });
        await screenshot.takeScreenshot(page, "Logged In");

        expect(authorizeWasPost).toBe(true);
        // Assert MSAL actually decrypted the EAR response (ear_jwe) rather than
        // falling back to a non-EAR auth-code flow.
        expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
        // Verify browser cache contains Account, idToken, AccessToken and
        // RefreshToken (EAR delivers the RefreshToken inline in the response).
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

        // EAR forces the /authorize request to be a POST form. In the popup flow
        // that request is issued by the popup window, so listen there. Attach
        // the listener as soon as the popup exists, before credentials are
        // entered, so the /authorize navigation is captured.
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

        // Assert the popup actually used the Encrypted Authorize Response flow
        // (POST /authorize), not the default auth-code GET navigation.
        expect(authorizeWasPost).toBe(true);
        // Assert MSAL actually decrypted the EAR response (ear_jwe) in this
        // window rather than falling back to a non-EAR auth-code flow.
        expect(await getEarDecryptCount(page)).toBeGreaterThan(0);
        // Verify browser cache contains Account, idToken, AccessToken and
        // RefreshToken (EAR delivers the RefreshToken inline in the response).
        await BrowserCache.verifyTokenStore({ scopes: EAR_SCOPES });
    });
});
