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

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/core-scenarios/popup");
let sampleHomeUrl = "";

describe.skip("Popup tests", () => {
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
        page.setDefaultTimeout(2000);
        BrowserCache = new BrowserCacheUtils(page, "localStorage");
        sampleHomeUrl = `http://localhost:${port}/playground`;
        await page.goto(sampleHomeUrl, { timeout: 2000 });
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("Performs loginPopup", async () => {
        const testName = "popupBaseCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);

        await page.locator("button#btnAcquireTokenPopup").click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
            }
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });

    it("acquireTokenPopup with httpMethod = POST", async () => {
        const testName = "acquireTokenPopupUsingPost";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration({...defaultTokenRequest, httpMethod: 'POST'}, page, screenshot);

        await page.locator("button#btnAcquireTokenPopup").click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
        }
        const networkRequests: puppeteer.HTTPRequest[] = [];
        popupPage.on('request', (request) => {
            // Track all requests to authentication endpoints
            if (request.url().includes('/authorize') && request.method() === 'POST') {
                networkRequests.push(request);
            }
        });
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        expect(networkRequests.length).toBeGreaterThanOrEqual(1); // Verify that a POST request was made to /authorize

        await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");

        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });
    });
});