import * as path from "path";
import { spawn, ChildProcess } from "child_process";
import * as puppeteer from "puppeteer";
import {
    Screenshot,
    BrowserCacheUtils,
    enterCredentials,
    setupCredentials,
    LabClient,
    AzureEnvironments,
    AppTypes,
} from "e2e-test-utils";
import { AuthenticationFlowTestUtils } from "./AuthenticationFlowTestUtils";
import {
    createPlatformBrokerProfile,
    launchPlatformBrokerBrowser,
    PLATFORM_LOGIN_TIMEOUT,
    PlatformBrokerProfile,
    removePlatformBrokerProfile,
    verifyPlatformBrokerResponse,
    verifyPlatformBrokerTokenStore,
} from "./platformBrokerTestUtils";

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

const EAR_CACHE_LOCATION = "sessionStorage";
const EAR_ORIGIN = `https://localhost:${EAR_PORT}`;
const EAR_CRYPTO_ALGORITHM = "AES-GCM";

// Platform-broker EAR tests are local-only: they need the MS SSO extension,
// native host and a brokerable lab account available for SSO, none of which exist
// in ADO/prod CI. This whole spec is excluded from CI by the `ear-basic`
// testFilter in the pipeline; run it locally by pointing SSO_EXTENSION_PATH at
// the unpacked "Microsoft Single Sign On" extension directory.
describe.each([
    {
        mode: "symmetric",
        query: "?ear=true&platformBroker=true",
        algorithm: "dir",
    },
    {
        mode: "asymmetric",
        query: "?ear=true&platformBroker=true&asymmetricEar=true",
        algorithm: "ECDH-ES",
    },
])("EAR + Platform Broker Tests ($mode)", ({ mode, query, algorithm }) => {
    let browser: puppeteer.Browser;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let flowUtils: AuthenticationFlowTestUtils;
    let earServerProcess: ChildProcess;
    let profile: PlatformBrokerProfile;
    let username = "";
    let accountPwd = "";

    const completeSignIn = async (
        authPage: puppeteer.Page,
        screenshot: Screenshot
    ) => {
        const loginPrompt = await authPage
            .waitForSelector('input[type="email"], #i0116', {
                visible: true,
                timeout: 10000,
            })
            .catch(() => null);
        if (loginPrompt) {
            await enterCredentials(authPage, screenshot, username, accountPwd);
        }
        await page.waitForSelector("a#viewProfileButton", {
            visible: true,
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
    };

    const assertEarRequests = (flow: AuthenticationFlowTestUtils) => {
        const requests = flow.getEarRequests();
        expect(requests.length).toBeGreaterThan(0);
        for (const request of requests) {
            expect(request).toEqual(
                expect.objectContaining({
                    method: "POST",
                    algorithm,
                    ...(mode === "asymmetric"
                        ? { curve: "P-384", hasApv: true, hasPrivateKey: false }
                        : { hasPrivateKey: true }),
                })
            );
        }
    };

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
        const labClient = new LabClient();
        const environments = await labClient.getVarsByCloudEnvironment({
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        });
        [username, accountPwd] = await setupCredentials(
            environments[0],
            labClient
        );
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
        const client = await page.createCDPSession();
        await client.send("Network.clearBrowserCookies");
        await client.detach();
        BrowserCache = new BrowserCacheUtils(page, EAR_CACHE_LOCATION);
        flowUtils = new AuthenticationFlowTestUtils(page);
        await flowUtils.installCryptoOperationSpy(
            EAR_ORIGIN,
            EAR_CRYPTO_ALGORITHM
        );
        await page.goto(`https://localhost:${EAR_PORT}/${query}`, {
            timeout: 10000,
        });
        await page.evaluate(
            `import("/js/authConfig.js").then(({ loginRequest }) => {
                loginRequest.loginHint = ${JSON.stringify(username)};
            })`
        );
        await flowUtils.assertCryptoOperationSpyInstalled(EAR_CRYPTO_ALGORITHM);
    });

    afterEach(async () => {
        if (!page) {
            return;
        }
        try {
            const remainingPrivateContexts = await page.evaluate(
                () =>
                    Object.keys(window.sessionStorage).filter((key) =>
                        key.includes(".request.asymmetric-ear.")
                    ).length
            );
            expect(remainingPrivateContexts).toBe(0);
        } finally {
            await page.evaluate(() => window.sessionStorage.clear());
            await page.evaluate(() => window.localStorage.clear());
            await page.close();
        }
    });

    it("Performs EAR + platform broker loginRedirect", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformRedirect`
        );

        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await completeSignIn(page, screenshot);
        await screenshot.takeScreenshot(page, "Logged In");

        // EAR still POSTs /authorize; ear_jwe is decrypted to extract accountId.
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        assertEarRequests(flowUtils);
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker loginPopup", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformPopup`
        );

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

        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        await completeSignIn(popupPage, screenshot);
        await screenshot.takeScreenshot(page, "Logged In");

        expect(
            popupFlowUtils?.getRequestCount("/authorize", "POST")
        ).toBeGreaterThan(0);
        assertEarRequests(popupFlowUtils!);
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker ssoSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformSsoSilent`
        );

        // Seed an interactive login to establish the account/session.
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await completeSignIn(page, screenshot);

        const decryptCountBefore = await flowUtils.getCryptoOperationCount(
            EAR_CRYPTO_ALGORITHM
        );
        const authorizeCountBefore = flowUtils.getEarRequests().length;

        await page.locator("button#ssoSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="ssoSilent:success"]',
            { timeout: 30000 }
        );
        await screenshot.takeScreenshot(page, "ssoSilent completed");

        // Silent EAR authorize re-runs; the platform broker services it again.
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(decryptCountBefore);
        expect(flowUtils.getEarRequests().length).toBeGreaterThan(
            authorizeCountBefore
        );
        assertEarRequests(flowUtils);
        await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker acquireTokenSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformAcquireTokenSilent`
        );

        // Seed an interactive login.
        await page.locator("button#signInButton").click();
        await page.locator("a#signInRedirect").click();
        await completeSignIn(page, screenshot);

        await page.locator("button#acquireTokenSilentButton").click();
        await page.waitForSelector(
            'div#silentStatus[data-status="acquireTokenSilent:success"]',
            { timeout: 30000 }
        );
        await screenshot.takeScreenshot(page, "acquireTokenSilent completed");

        // Platform accounts renew through the broker, not the EAR RT grant.
        assertEarRequests(flowUtils);
        await verifyPlatformBrokerResponse(page);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });
});
