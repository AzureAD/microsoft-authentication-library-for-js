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
} from "../authConfigs/aadAuthConfig.json";
import fs from "fs";
import path from "path";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../../../test/screenshots/customizable-e2e-test/browserAAD");
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

    describe("logout Tests", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
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

        it("logoutPopup", async () => {
            const [popupWindow, popupWindowClosed] = await clickLogoutPopup(
                screenshot,
                page
            );
            expect(
                popupWindow
                    .url()
                    .startsWith("https://login.microsoftonline.com/common/")
            ).toBeTruthy();
            expect(popupWindow.url()).toContain("logout");
            const tokenStore = await BrowserCache.getTokens();

            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);
        });
    });

    describe("login-logout-login tests", () => {
        let testName: string;
        let screenshot: Screenshot;

        async function loginRedirect() {
            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);
        }

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
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

        it("login-logout-login redirect", async () => {
            testName = "loginLogoutLoginRedirect";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await loginRedirect();

            await clickLogoutRedirect(screenshot, page);
            expect(
                page
                    .url()
                    .startsWith("https://login.microsoftonline.com/common/")
            ).toBeTruthy();
            expect(page.url()).toContain("logout");
            await page.waitForFunction(
                `window.location.href.startsWith("${sampleHomeUrl}")`
            );

            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);

            await clickLoginRedirect(screenshot, page);
            await page.waitForNavigation({ waitUntil: ["load", "domcontentloaded", "networkidle0"] }).catch(() => {});
            try {
                await page.waitForSelector("#loginHeader, div[name='loginHeader']");
            } catch (e) {
                await screenshot.takeScreenshot(page, "errorPage").catch(() => {});
                throw e;
            }
        });
    });
});
