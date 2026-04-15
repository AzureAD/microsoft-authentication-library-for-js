import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    ONE_SECOND_IN_MS,
    clickLoginPopup,
    clickLoginRedirect,
    clickLogoutPopup,
    clickLogoutRedirect,
    waitForReturnToApp,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
} from "e2e-test-utils";
import {
    msalConfig as aadMsalConfig,
    request as aadTokenRequest,
} from "../authConfigs/aadTenantedAuthConfig.json";
import fs from "fs";
import path from "path";
import { RedirectRequest } from "../../../../../../lib/msal-browser/src";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../../../test/screenshots/customizable-e2e-test/browserAADTenanted");
let sampleHomeUrl = "";

describe("AAD-Prod Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let username = "";
    let accountPwd = "";

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

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

        fs.writeFileSync(
            "./app/customizable-e2e-test/testConfig.json",
            JSON.stringify({
                msalConfig: aadMsalConfig,
                request: aadTokenRequest,
            })
        );
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();

            BrowserCache = new BrowserCacheUtils(
                page,
                aadMsalConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl);
            await pcaInitializedPoller(page, 5000);
        });

        afterEach(async () => {
            await page.evaluate(() =>
                Object.assign({}, window.sessionStorage.clear())
            );
            await page.evaluate(() =>
                Object.assign({}, window.localStorage.clear())
            );
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("Performs loginRedirect from url with empty query string", async () => {
            await page.goto(sampleHomeUrl + "?");
            const testName = "redirectEmptyQueryString";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
            expect(page.url()).toEqual(sampleHomeUrl);
        });

        it("Performs loginRedirect from url with test query string", async () => {
            const testUrl = sampleHomeUrl + "?test";
            await page.goto(testUrl);
            const testName = "redirectEmptyQueryString";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
            expect(page.url()).toEqual(testUrl);
        });

        it("Performs loginRedirect with relative redirectUri", async () => {
            const relativeRedirectUriRequest: RedirectRequest = {
                ...aadTokenRequest,
                redirectUri: "/",
            };
            fs.writeFileSync(
                "./app/customizable-e2e-test/testConfig.json",
                JSON.stringify({
                    msalConfig: aadMsalConfig,
                    request: relativeRedirectUriRequest,
                })
            );
            await page.reload();
            await pcaInitializedPoller(page, 5000);

            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("Performs loginRedirect with relative redirectStartPage", async () => {
            const relativeRedirectUriRequest: RedirectRequest = {
                ...aadTokenRequest,
                redirectStartPage: "/",
            };
            fs.writeFileSync(
                "./app/customizable-e2e-test/testConfig.json",
                JSON.stringify({
                    msalConfig: aadMsalConfig,
                    request: relativeRedirectUriRequest,
                })
            );
            await page.reload();
            await pcaInitializedPoller(page, 5000);

            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("Redirect bridge reads cache keys for ORIGIN_URI during redirect flow", async () => {
            const customStartPage = sampleHomeUrl + "?redirectBridgeOriginUriTest=1";
            const redirectStartPageRequest: RedirectRequest = {
                ...aadTokenRequest,
                redirectStartPage: customStartPage,
            };
            fs.writeFileSync(
                "./app/customizable-e2e-test/testConfig.json",
                JSON.stringify({
                    msalConfig: aadMsalConfig,
                    request: redirectStartPageRequest,
                })
            );
            await page.reload();
            await pcaInitializedPoller(page, 5000);

            const testName = "redirectBridgeCacheKeys";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await clickLoginRedirect(screenshot, page);

            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);

            // Verify the browser navigated back to the custom redirectStartPage
            expect(page.url()).toContain("redirectBridgeOriginUriTest=1");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            const [popupPage, popupWindowClosed] = await clickLoginPopup(
                screenshot,
                page
            );
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(
                screenshot,
                page,
                popupPage,
                popupWindowClosed
            );

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });
    });

    describe("logout Tests", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();

            BrowserCache = new BrowserCacheUtils(
                page,
                aadMsalConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl);
            await pcaInitializedPoller(page, 5000);

            testName = "logoutBaseCase";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            const [popupPage, popupWindowClosed] = await clickLoginPopup(
                screenshot,
                page
            );
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(
                screenshot,
                page,
                popupPage,
                popupWindowClosed
            );
            await pcaInitializedPoller(page, 5000);
        });

        afterEach(async () => {
            await page.evaluate(() =>
                Object.assign({}, window.sessionStorage.clear())
            );
            await page.evaluate(() =>
                Object.assign({}, window.localStorage.clear())
            );
            await page.close();
        });

        it("logoutRedirect", async () => {
            await clickLogoutRedirect(screenshot, page);
            expect(
                page
                    .url()
                    .startsWith(
                        "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133/"
                    )
            ).toBeTruthy();
            expect(page.url()).toContain("logout");
            // Skip server sign-out
            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);
        });

        it("logoutPopup", async () => {
            const [popupWindow, popupWindowClosed] = await clickLogoutPopup(
                screenshot,
                page
            );
            expect(
                popupWindow
                    .url()
                    .startsWith(
                        "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133/"
                    )
            ).toBeTruthy();
            expect(popupWindow.url()).toContain("logout");
            const tokenStore = await BrowserCache.getTokens();

            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);

            // Verify the popup window is closed after logout completes
            await popupWindowClosed;
            expect(popupWindow.isClosed()).toBeTruthy();
        });
    });

    describe("acquireToken Tests", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeAll(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();

            BrowserCache = new BrowserCacheUtils(
                page,
                aadMsalConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl);

            testName = "acquireTokenBaseCase";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            const [popupPage, popupWindowClosed] = await clickLoginPopup(
                screenshot,
                page
            );
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(
                screenshot,
                page,
                popupPage,
                popupWindowClosed
            );
        });

        beforeEach(async () => {
            await page.reload();
            await page.waitForSelector("#WelcomeMessage");
            await pcaInitializedPoller(page, 5000);
        });

        afterAll(async () => {
            await page.evaluate(() =>
                Object.assign({}, window.sessionStorage.clear())
            );
            await page.evaluate(() =>
                Object.assign({}, window.localStorage.clear())
            );
            await page.close();
        });

        it("acquireTokenRedirect", async () => {
            testName = "acquireTokenRedirect";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await page.waitForSelector("#acquireTokenRedirect");

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.refreshTokens);
            await BrowserCache.removeTokens(tokenStore.accessTokens);
            await page.click("#acquireTokenRedirect");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(
                page,
                "acquireTokenRedirectGotTokens"
            );

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("acquireTokenPopup", async () => {
            testName = "acquireTokenPopup";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await page.waitForSelector("#acquireTokenPopup");

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.refreshTokens);
            await BrowserCache.removeTokens(tokenStore.accessTokens);
            await page.click("#acquireTokenPopup");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("acquireTokenSilent from Cache", async () => {
            testName = "acquireTokenSilentCache";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await page.waitForSelector("#acquireTokenSilent");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(
                page,
                "acquireTokenSilent-fromCache-GotTokens"
            );

            const telemetryCacheEntry =
                await BrowserCache.getTelemetryCacheEntry(
                    aadMsalConfig.auth.clientId
                );
            expect(telemetryCacheEntry).toBeDefined();
            expect(telemetryCacheEntry["cacheHits"]).toEqual(1);
            // Remove Telemetry Cache entry for next test
            await BrowserCache.removeTokens([
                BrowserCacheUtils.getTelemetryKey(aadMsalConfig.auth.clientId),
            ]);

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("acquireTokenSilent via RefreshToken", async () => {
            testName = "acquireTokenSilentRT";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await page.waitForSelector("#acquireTokenSilent");

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.accessTokens);

            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(
                page,
                "acquireTokenSilent-viaRefresh-GotTokens"
            );

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });
    });
});

