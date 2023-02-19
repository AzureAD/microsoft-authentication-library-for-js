import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials, enterCredentials, ONE_SECOND_IN_MS, retrieveAppConfiguration } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, UserTypes, AppPlatforms } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { clickLoginPopup, clickLoginRedirect, clickLogoutPopup, clickLogoutRedirect, waitForReturnToApp } from "./testUtils";
import fs from "fs";
import { RedirectRequest, Configuration } from "../../../../../../lib/msal-browser/src";
import { getBrowser, getHomeUrl } from "../../testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/default tests`;
let sampleHomeUrl = "";

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens).toHaveLength(1);
    expect(tokenStore.accessTokens).toHaveLength(1);
    expect(tokenStore.refreshTokens).toHaveLength(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy();
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toEqual(4);
}


describe("AAD Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let clientID: string;
    let authority: string;
    let username = "";
    let accountPwd = "";
    let msalConfig: Configuration;
    let request: any;

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            userType: UserTypes.CLOUD,
            appPlatform: AppPlatforms.SPA,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        [clientID, , authority] = await retrieveAppConfiguration(envResponse[0], labClient, false);

        msalConfig = {
            auth: {
                clientId: clientID,
                authority: authority
            },
            cache: {
                cacheLocation: "sessionStorage",
                storeAuthStateInCookie: false
            }
        };

        request = {
            scopes: ["User.Read"]
        }

        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({ msalConfig: msalConfig, request: request }));
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({}));
    });

    describe("login Tests", () => {
        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
            await page.goto(sampleHomeUrl);
        });

        afterEach(async () => {
            await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
            await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("Performs loginRedirect from url with empty query string", async () => {
            await page.goto(sampleHomeUrl + "?");
            const testName = "redirectEmptyQueryString";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
            expect(page.url()).toEqual(sampleHomeUrl);
        });

        it("Performs loginRedirect from url with test query string", async () => {
            const testUrl = sampleHomeUrl + "?test";
            await page.goto(testUrl);
            const testName = "redirectEmptyQueryString";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
            expect(page.url()).toEqual(testUrl);
        });

        it("Performs loginRedirect with relative redirectUri", async () => {
            const relativeRedirectUriRequest: RedirectRequest = {
                ...request,
                redirectUri: "/"
            }
            fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({ msalConfig: msalConfig, request: relativeRedirectUriRequest }));
            page.reload();

            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("Performs loginRedirect with relative redirectStartPage", async () => {
            const relativeRedirectUriRequest: RedirectRequest = {
                ...request,
                redirectStartPage: "/"
            }
            fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({ msalConfig: msalConfig, request: relativeRedirectUriRequest }));
            page.reload();

            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });
    });

    describe("logout Tests", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
            await page.goto(sampleHomeUrl);

            testName = "logoutBaseCase";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);
        });

        afterEach(async () => {
            await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
            await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
            await page.close();
        });

        it("logoutRedirect", async () => {
            await clickLogoutRedirect(screenshot, page);
            expect(page.url().startsWith(authority)).toBeTruthy();
            expect(page.url()).toContain("logout");
            // Skip server sign-out
            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);
        });

        it("logoutPopup", async () => {
            const [popupWindow, popupWindowClosed] = await clickLogoutPopup(screenshot, page);
            await popupWindow.waitForNavigation();
            expect(popupWindow.url().startsWith(authority)).toBeTruthy();
            expect(popupWindow.url()).toContain("logout");
            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);
        });
    });

    describe("acquireToken Tests", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeAll(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
            await page.goto(sampleHomeUrl);

            testName = "acquireTokenBaseCase";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);
        });

        beforeEach(async () => {
            await page.reload();
            await page.waitForSelector("#WelcomeMessage");
        });

        afterAll(async () => {
            await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
            await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
            await page.close();
        });

        it("acquireTokenRedirect", async () => {
            testName = "acquireTokenRedirect";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await page.waitForSelector("#acquireTokenRedirect");

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.refreshTokens);
            await BrowserCache.removeTokens(tokenStore.accessTokens);
            await page.click("#acquireTokenRedirect");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "acquireTokenRedirectGotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("acquireTokenPopup", async () => {
            testName = "acquireTokenPopup";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await page.waitForSelector("#acquireTokenPopup");

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.refreshTokens);
            await BrowserCache.removeTokens(tokenStore.accessTokens);
            await page.click("#acquireTokenPopup");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("acquireTokenSilent from Cache", async () => {
            testName = "acquireTokenSilentCache";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await page.waitForSelector("#acquireTokenSilent");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

            const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(msalConfig.auth.clientId);
            expect(telemetryCacheEntry).toBeDefined();
            expect(telemetryCacheEntry["cacheHits"]).toEqual(1);
            // Remove Telemetry Cache entry for next test
            await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(msalConfig.auth.clientId)]);

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });

        it("acquireTokenSilent via RefreshToken", async () => {
            testName = "acquireTokenSilentRT";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await page.waitForSelector("#acquireTokenSilent");

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.accessTokens);

            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-GotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await verifyTokenStore(BrowserCache, request.scopes);
        });
    });
});
