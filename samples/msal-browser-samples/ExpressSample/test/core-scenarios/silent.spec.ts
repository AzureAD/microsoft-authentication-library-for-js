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
import { defaultPcaConfig, defaultTokenRequest, setPCAConfiguration, setRequestConfiguration, signInPopup } from "../test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/core-scenarios/silent");
let sampleHomeUrl = "";

describe("Silent tests", () => {
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
        await page.goto(sampleHomeUrl, { timeout: 2000 });
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("acquireTokenSilent from Cache", async () => {
        const testName = "acquireTokenSilentCache";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);
        await signInPopup(page, screenshot, username, accountPwd);

        await page.locator("button#btnAcquireTokenSilent").click();
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        expect(JSON.parse(response || "{}").result.fromCache).toBe(true);
        await screenshot.takeScreenshot(
            page,
            "acquireTokenSilent-fromCache-GotTokens"
        );
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("acquireTokenSilent via RefreshToken with forceRefresh", async () => {
        const testName = "acquireTokenSilentForceRefresh";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({...defaultTokenRequest, forceRefresh: true}, page, screenshot);
        await signInPopup(page, screenshot, username, accountPwd);

        await page.locator("button#btnAcquireTokenSilent").click();
        await screenshot.takeScreenshot(page, "button pushed");
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        expect(JSON.parse(response || "{}").result.fromCache).toBe(false);
        await screenshot.takeScreenshot(
            page,
            "acquireTokenSilent-forceRefresh-GotTokens"
        );
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("acquireTokenSilent via RefreshToken with accessToken not found", async () => {
        const testName = "acquireTokenSilentNoAT";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);
        // Login to ensure an RT exists
        await signInPopup(page, screenshot, username, accountPwd);

        // Remove Access Token from cache to force RT flow
        let tokenKeys = await BrowserCache.getTokens();
        await BrowserCache.removeTokens(tokenKeys.accessTokens);
        tokenKeys = await BrowserCache.getTokens();
        expect(tokenKeys.accessTokens.length).toBe(0);
        expect(tokenKeys.refreshTokens.length).toBe(1);
        await page.reload();

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);
        await page.locator("button#btnAcquireTokenSilent").click();
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        expect(JSON.parse(response || "{}").result.fromCache).toBe(false);
        await screenshot.takeScreenshot(
            page,
            "acquireTokenSilent-NoAT-GotTokens"
        );
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("acquireTokenSilent via RefreshToken with accessToken and refresh token not found", async () => {
        const testName = "acquireTokenSilentNoAT";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);
        // Login to ensure an RT exists
        await signInPopup(page, screenshot, username, accountPwd);

        // Remove Access Token from cache to force RT flow
        let tokenKeys = await BrowserCache.getTokens();
        await BrowserCache.removeTokens(tokenKeys.accessTokens);
        await BrowserCache.removeTokens(tokenKeys.refreshTokens);
        tokenKeys = await BrowserCache.getTokens();
        expect(tokenKeys.accessTokens.length).toBe(0);
        expect(tokenKeys.refreshTokens.length).toBe(0);
        await page.reload();

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);
        await page.locator("button#btnAcquireTokenSilent").click();
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        expect(JSON.parse(response || "{}").result.fromCache).toBe(false);
        await screenshot.takeScreenshot(
            page,
            "acquireTokenSilent-NoAT-GotTokens"
        );
        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });
});