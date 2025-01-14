import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    ONE_SECOND_IN_MS,
    b2cAadPpeAccountEnterCredentials,
    b2cLocalAccountEnterCredentials,
    clickLoginPopup,
    clickLoginRedirect,
    waitForReturnToApp,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    UserTypes,
    B2cProviders,
    LabClient,
} from "e2e-test-utils";
import {
    msalConfig as b2cMsalConfig,
    request as b2cTokenRequest,
} from "../authConfigs/b2cAuthConfig.json";
import fs from "fs";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/default tests`;
let sampleHomeUrl = "";

describe("B2C Tests", () => {
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

        fs.writeFileSync(
            "./app/customizable-e2e-test/testConfig.json",
            JSON.stringify({
                msalConfig: b2cMsalConfig,
                request: b2cTokenRequest,
            })
        );
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    // TODO: Unskip when AAD client app registration is updated
    describe.skip("AAD Account", () => {
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
        });

        describe("login Tests", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(
                    page,
                    b2cMsalConfig.cache.cacheLocation
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
                const testName = "b2cRedirectBaseCase";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                await clickLoginRedirect(screenshot, page);
                await b2cAadPpeAccountEnterCredentials(
                    page,
                    screenshot,
                    username,
                    accountPwd
                );
                await waitForReturnToApp(screenshot, page);

                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("Performs loginPopup", async () => {
                const testName = "b2cPopupBaseCase";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                const [popupPage, popupWindowClosed] = await clickLoginPopup(
                    screenshot,
                    page
                );
                await b2cAadPpeAccountEnterCredentials(
                    popupPage,
                    screenshot,
                    username,
                    accountPwd
                );
                await waitForReturnToApp(
                    screenshot,
                    page,
                    popupPage,
                    popupWindowClosed
                );

                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });
        });

        describe("acquireToken Tests", () => {
            let testName: string;
            let screenshot: Screenshot;

            beforeAll(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(
                    page,
                    b2cMsalConfig.cache.cacheLocation
                );
                await page.goto(sampleHomeUrl);

                testName = "b2cAcquireTokenBaseCase";
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                const [popupPage, popupWindowClosed] = await clickLoginPopup(
                    screenshot,
                    page
                );
                await b2cAadPpeAccountEnterCredentials(
                    popupPage,
                    screenshot,
                    username,
                    accountPwd
                );
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

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("acquireTokenPopup", async () => {
                await page.waitForSelector("#acquireTokenPopup");

                // Remove access_tokens from cache so we can verify acquisition
                const tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.refreshTokens);
                await BrowserCache.removeTokens(tokenStore.accessTokens);
                await page.click("#acquireTokenPopup");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(
                    page,
                    "acquireTokenPopupGotTokens"
                );

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("acquireTokenSilent from Cache", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(
                    page,
                    "acquireTokenSilent-fromCache-GotTokens"
                );

                const telemetryCacheEntry =
                    await BrowserCache.getTelemetryCacheEntry(
                        b2cMsalConfig.auth.clientId
                    );
                expect(telemetryCacheEntry).toBeDefined();
                expect(telemetryCacheEntry["cacheHits"]).toEqual(1);
                // Remove Telemetry Cache entry for next test
                await BrowserCache.removeTokens([
                    BrowserCacheUtils.getTelemetryKey(
                        b2cMsalConfig.auth.clientId
                    ),
                ]);

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("acquireTokenSilent via RefreshToken", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                // Remove access_tokens from cache so we can verify acquisition
                let tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.accessTokens);

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(
                    page,
                    "acquireTokenSilent-viaRefresh-GotTokens"
                );

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });
        });
    });

    describe("Local Account", () => {
        beforeAll(async () => {
            const labApiParams: LabApiQueryParams = {
                userType: UserTypes.B2C,
                b2cProvider: B2cProviders.LOCAL,
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

        describe("login Tests", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(
                    page,
                    b2cMsalConfig.cache.cacheLocation
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
                const testName = "b2cRedirectLocalAccountCase";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                await clickLoginRedirect(screenshot, page);
                await b2cLocalAccountEnterCredentials(
                    page,
                    screenshot,
                    username,
                    accountPwd
                );
                await waitForReturnToApp(screenshot, page);

                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("Performs loginPopup", async () => {
                const testName = "b2cPopupLocalAccountCase";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                const [popupPage, popupWindowClosed] = await clickLoginPopup(
                    screenshot,
                    page
                );
                await b2cLocalAccountEnterCredentials(
                    popupPage,
                    screenshot,
                    username,
                    accountPwd
                );
                await waitForReturnToApp(
                    screenshot,
                    page,
                    popupPage,
                    popupWindowClosed
                );

                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });
        });

        describe("acquireToken Tests", () => {
            let testName: string;
            let screenshot: Screenshot;

            beforeAll(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(
                    page,
                    b2cMsalConfig.cache.cacheLocation
                );
                await page.goto(sampleHomeUrl);

                testName = "b2cAcquireTokenLocalAccountCase";
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                const [popupPage, popupWindowClosed] = await clickLoginPopup(
                    screenshot,
                    page
                );
                await b2cLocalAccountEnterCredentials(
                    popupPage,
                    screenshot,
                    username,
                    accountPwd
                );
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

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("acquireTokenPopup", async () => {
                await page.waitForSelector("#acquireTokenPopup");

                // Remove access_tokens from cache so we can verify acquisition
                const tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.refreshTokens);
                await BrowserCache.removeTokens(tokenStore.accessTokens);
                await page.click("#acquireTokenPopup");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(
                    page,
                    "acquireTokenPopupGotTokens"
                );

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("acquireTokenSilent from Cache", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(
                    page,
                    "acquireTokenSilent-fromCache-GotTokens"
                );

                const telemetryCacheEntry =
                    await BrowserCache.getTelemetryCacheEntry(
                        b2cMsalConfig.auth.clientId
                    );
                expect(telemetryCacheEntry).toBeDefined();
                expect(telemetryCacheEntry["cacheHits"]).toEqual(1);
                // Remove Telemetry Cache entry for next test
                await BrowserCache.removeTokens([
                    BrowserCacheUtils.getTelemetryKey(
                        b2cMsalConfig.auth.clientId
                    ),
                ]);

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });

            it("acquireTokenSilent via RefreshToken", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                // Remove access_tokens from cache so we can verify acquisition
                let tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.accessTokens);

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(
                    page,
                    "acquireTokenSilent-viaRefresh-GotTokens"
                );

                // Verify we now have an access_token
                await BrowserCache.verifyTokenStore({
                    scopes: b2cTokenRequest.scopes,
                });
            });
        });
    });
});
