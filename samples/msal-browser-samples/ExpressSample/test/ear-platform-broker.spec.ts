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
    createPlatformBrokerProfile,
    launchPlatformBrokerBrowser,
    PLATFORM_LOGIN_TIMEOUT,
    PlatformBrokerProfile,
    removePlatformBrokerProfile,
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
        algorithm: "dir",
    },
    {
        mode: "asymmetric",
        algorithm: "ECDH-ES",
    },
])("EAR + Platform Broker Tests ($mode)", ({ mode, algorithm }) => {
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
    };

    const configurePlayground = async () => {
        await page.waitForSelector("#msalConfig", {
            timeout: PLATFORM_LOGIN_TIMEOUT,
        });
        await page.evaluate(
            ({ origin, asymmetric, loginHint }) => {
                (
                    document.getElementById("msalConfig") as HTMLTextAreaElement
                ).value = JSON.stringify({
                    auth: {
                        clientId: "9f33d0de-fdfd-431b-a565-af47c697a4c4",
                        authority:
                            "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133",
                        redirectUri: `${origin}/redirect`,
                    },
                    cache: { cacheLocation: "sessionStorage" },
                    system: { protocolMode: "EAR", allowPlatformBroker: true },
                    experimental: { enableAsymmetricEar: asymmetric },
                });
                (
                    document.getElementById(
                        "tokenRequest"
                    ) as HTMLTextAreaElement
                ).value = JSON.stringify({ scopes: ["User.Read"], loginHint });
            },
            {
                origin: EAR_ORIGIN,
                asymmetric: mode === "asymmetric",
                loginHint: username,
            }
        );
        await page.locator("button#applyConfig").click();
        await page.waitForFunction(
            () => {
                const text =
                    document.getElementById("responseContent")?.textContent ||
                    "";
                return (
                    text.includes("MSAL instance created and initialized") ||
                    text.includes("Redirect response received")
                );
            },
            { timeout: PLATFORM_LOGIN_TIMEOUT }
        );
    };

    const assertPlatformBrokerResponse = async (api: string) => {
        await page.waitForFunction(
            (expectedApi) => {
                const text =
                    document.getElementById("responseContent")?.textContent ||
                    "";
                return (
                    text.includes(`"api": "${expectedApi}"`) &&
                    (text.includes('"result"') ||
                        text.includes('"response"') ||
                        text.includes('"error"'))
                );
            },
            { timeout: PLATFORM_LOGIN_TIMEOUT },
            api
        );
        const response = JSON.parse(
            await page.$eval(
                "#responseContent",
                (element) => element.textContent || ""
            )
        );
        expect(response.error).toBeUndefined();
        const result = response.result || response.response;
        expect(result?.fromPlatformBroker).toBe(true);
        expect(result?.account?.nativeAccountId).toBeTruthy();
        expect(result?.accessToken).toBeTruthy();
    };

    const signInRedirect = async (screenshot: Screenshot) => {
        await page.locator("button#btnAcquireTokenRedirect").click();
        await completeSignIn(page, screenshot);
        await page.waitForFunction(
            () => window.location.pathname === "/playground",
            {
                timeout: PLATFORM_LOGIN_TIMEOUT,
            }
        );
        await configurePlayground();
        await assertPlatformBrokerResponse("acquireTokenRedirect");
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
        await page.goto(`${EAR_ORIGIN}/playground`, {
            timeout: 10000,
        });
        await configurePlayground();
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
                        key.endsWith(".request.params")
                    ).length
            );
            expect(remainingPrivateContexts).toBe(0);
        } finally {
            await page.evaluate(() => window.sessionStorage.clear());
            await page.evaluate(() => window.localStorage.clear());
            await page.close();
        }
    });

    it("Performs EAR + platform broker acquireTokenRedirect", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformRedirect`
        );

        await signInRedirect(screenshot);
        await screenshot.takeScreenshot(page, "Logged In");

        // EAR still POSTs /authorize; ear_jwe is decrypted to extract accountId.
        expect(flowUtils.getRequestCount("/authorize", "POST")).toBeGreaterThan(
            0
        );
        assertEarRequests(flowUtils);
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker acquireTokenPopup", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformPopup`
        );

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
        await page.locator("button#btnAcquireTokenPopup").click();

        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error("Popup window was not opened");
        }

        await completeSignIn(popupPage, screenshot);
        await assertPlatformBrokerResponse("acquireTokenPopup");
        await screenshot.takeScreenshot(page, "Logged In");

        expect(
            popupFlowUtils?.getRequestCount("/authorize", "POST")
        ).toBeGreaterThan(0);
        assertEarRequests(popupFlowUtils!);
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(0);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker ssoSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformSsoSilent`
        );

        // Seed an interactive login to establish the account/session.
        await signInRedirect(screenshot);

        const decryptCountBefore = await flowUtils.getCryptoOperationCount(
            EAR_CRYPTO_ALGORITHM
        );
        const authorizeCountBefore = flowUtils.getEarRequests().length;

        await page.locator("button#btnSsoSilent").click();
        await assertPlatformBrokerResponse("ssoSilent");
        await screenshot.takeScreenshot(page, "ssoSilent completed");

        // Silent EAR authorize re-runs; the platform broker services it again.
        expect(
            await flowUtils.getCryptoOperationCount(EAR_CRYPTO_ALGORITHM)
        ).toBeGreaterThan(decryptCountBefore);
        expect(flowUtils.getEarRequests().length).toBeGreaterThan(
            authorizeCountBefore
        );
        assertEarRequests(flowUtils);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });

    it("Performs EAR + platform broker acquireTokenSilent", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${mode}/earPlatformAcquireTokenSilent`
        );

        // Seed an interactive login.
        await signInRedirect(screenshot);

        await page.locator("button#btnAcquireTokenSilent").click();
        await assertPlatformBrokerResponse("acquireTokenSilent");
        await screenshot.takeScreenshot(page, "acquireTokenSilent completed");

        // Platform accounts renew through the broker, not the EAR RT grant.
        assertEarRequests(flowUtils);
        await verifyPlatformBrokerTokenStore(BrowserCache);
    });
});
