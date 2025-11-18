import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    enterCredentials,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
} from "e2e-test-utils";
import path from "path";
import { defaultPcaConfig, defaultTokenRequest, setPCAConfiguration, setRequestConfiguration } from "../test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/core-scenarios/redirect");
let sampleHomeUrl = "";

describe("Redirect tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let BrowserCache: BrowserCacheUtils;
    let username = "";
    let accountPwd = "";

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = global.__PORT__;

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

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(5000);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        sampleHomeUrl = `http://localhost:${port}/playground`;
        await page.goto(sampleHomeUrl);
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("Performs loginRedirect", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);

        await page.locator("button#btnAcquireTokenRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.locator("div#responseDisplay").wait();
        await screenshot.takeScreenshot(page, "Returned to app");
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("Performs loginRedirect from url with test query string", async () => {
        const testUrl = sampleHomeUrl + "?test";
        await page.goto(testUrl);
        const testName = "redirectEmptyQueryString";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);

        await page.locator("button#btnAcquireTokenRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.locator("div#responseDisplay").wait();
        await screenshot.takeScreenshot(page, "Returned to app");
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
        expect(page.url()).toEqual(testUrl);
    });

    it("Performs loginRedirect with relative redirectUri", async () => {
        const testName = "redirectRelativeRedirectUri";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({...defaultTokenRequest, redirectUri: "/"}, page, screenshot);

        await page.locator("button#btnAcquireTokenRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.locator("div#responseDisplay").wait();
        await screenshot.takeScreenshot(page, "Returned to app");
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("Performs loginRedirect with relative redirectStartPage", async () => {
        const testName = "redirectRelativeRedirectStartPage";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({...defaultTokenRequest, redirectStartPage: "/playground"}, page, screenshot);

        await page.locator("button#btnAcquireTokenRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.locator("div#responseDisplay").wait();
        await screenshot.takeScreenshot(page, "Returned to app");
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("acquireTokenRedirect with httpMethod = POST", async () => {
        const testName = "acquireTokenRedirectUsingPost";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({...defaultTokenRequest, httpMethod: "POST"}, page, screenshot);

        const networkRequests: puppeteer.HTTPRequest[] = [];
        page.on('request', (request) => {
            // Track all requests to authentication endpoints
            if (request.url().includes('/authorize') && request.method() === 'POST') {
                networkRequests.push(request);
            }
        });

        await page.locator("button#btnAcquireTokenRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        expect(networkRequests.length).toBeGreaterThanOrEqual(1); // Verify that a POST request was made to /authorize
        await page.locator("div#responseDisplay").wait();
        await screenshot.takeScreenshot(page, "Returned to app");

        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("logoutRedirect", async () => {
        const testName = "logoutRedirect";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);

        await page.locator("button#btnAcquireTokenRedirect").click();
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.locator("div#responseDisplay").wait();
        await screenshot.takeScreenshot(page, "Returned to app");
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({}, page, screenshot);
        await page.locator("button#btnLogoutRedirect").click();
        // Verify redirect to logout page
        await page.waitForRequest(request => request.url().startsWith("https://login.microsoftonline.com/common/oauth2/v2.0/logout"), { timeout: 2000 });
        // Verify tokens were cleared
        await page.goto(sampleHomeUrl);
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({}, page, screenshot);
        await page.locator("button#btnGetAllAccounts").click();
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "getAllAccounts called");
        expect(JSON.parse(response || "{}").result).toEqual([]);

        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens.length).toEqual(0);
        expect(tokenStore.accessTokens.length).toEqual(0);
        expect(tokenStore.refreshTokens.length).toEqual(0);
    });
});