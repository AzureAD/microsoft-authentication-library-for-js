import * as puppeteer from "puppeteer";
import {
    Screenshot,
    setupCredentials,
    b2cLocalAccountEnterCredentials,
    BrowserCacheUtils,
    LabApiQueryParams,
    UserTypes,
    B2cProviders,
    LabClient,
} from "e2e-test-utils";
import path from "path";
import { setPCAConfiguration, setRequestConfiguration } from "../test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/authority/b2c");
let sampleHomeUrl = "";

// B2C configuration
const b2cMsalConfig = {
    auth: {
        clientId: "4c837770-7a2b-471e-aafa-3328d04a23b1",
        authority: "https://msidlabb2c.b2clogin.com/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy/",
        knownAuthorities: ["msidlabb2c.b2clogin.com"],
        redirectUri: "/"
    },
    cache: {
        cacheLocation: "localStorage"
    }
};

const tokenRequest = {
    scopes: ["https://msidlabb2c.onmicrosoft.com/4c837770-7a2b-471e-aafa-3328d04a23b1/read"]
};

describe("B2C Tests", () => {
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

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(5000);
        BrowserCache = new BrowserCacheUtils(page, b2cMsalConfig.cache.cacheLocation);
        sampleHomeUrl = `http://localhost:${port}/playground`;
        await page.goto(sampleHomeUrl);
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    it("acquireTokenRedirect", async () => {
        const testName = "b2cAcquireTokenRedirect";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(b2cMsalConfig, page, screenshot);
        await setRequestConfiguration(tokenRequest, page, screenshot);

        // Sign in via redirect
        await page.locator("button#btnAcquireTokenRedirect").click();
        await b2cLocalAccountEnterCredentials(page, screenshot, username, accountPwd);
        await page.waitForFunction(() => window.location.href.startsWith("http://localhost"));
        // Need to manually move back to start page because it's not a registered redirectUri 
        // and HRP running on home page is using different clientId
        const hash = page.url().split("#")[1];
        await page.goto(`${sampleHomeUrl}#${hash}`);
        await setPCAConfiguration(b2cMsalConfig, page, screenshot);
        await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "signInRedirectGotTokens");

        await BrowserCache.verifyTokenStore({
            scopes: tokenRequest.scopes,
        });
    });

    it("acquireTokenPopup", async () => {
        const testName = "b2cAcquireTokenPopup";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(b2cMsalConfig, page, screenshot);
        await setRequestConfiguration(tokenRequest, page, screenshot);

        // Sign in via popup
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await page.locator("button#btnAcquireTokenPopup").click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
        }
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );
        await b2cLocalAccountEnterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "signInPopupGotTokens");

        await BrowserCache.verifyTokenStore({
            scopes: tokenRequest.scopes,
        });
    });

    it("acquireTokenSilent from Cache", async () => {
        const testName = "b2cAcquireTokenSilentCache";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(b2cMsalConfig, page, screenshot);
        await setRequestConfiguration(tokenRequest, page, screenshot);

        // Sign in via popup
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await page.locator("button#btnAcquireTokenPopup").click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
        }
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );
        await b2cLocalAccountEnterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "signInPopupGotTokens");

        await page.locator("button#clearResponse").click();

        await page.locator("button#btnAcquireTokenSilent").click();
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        expect(JSON.parse(response || "{}").result.fromCache).toBe(true);
        await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

        await BrowserCache.verifyTokenStore({
            scopes: tokenRequest.scopes,
        });
    });

    it("acquireTokenSilent via RefreshToken", async () => {
        const testName = "b2cAcquireTokenSilentRT";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        await setPCAConfiguration(b2cMsalConfig, page, screenshot);
        await setRequestConfiguration(tokenRequest, page, screenshot);

        // Sign in via popup
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await page.locator("button#btnAcquireTokenPopup").click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
        }
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );
        await b2cLocalAccountEnterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "signInPopupGotTokens");

        // Remove Access Token from cache to force RT flow
        let tokenKeys = await BrowserCache.getTokens();
        await BrowserCache.removeTokens(tokenKeys.accessTokens);
        tokenKeys = await BrowserCache.getTokens();
        expect(tokenKeys.accessTokens.length).toBe(0);
        expect(tokenKeys.refreshTokens.length).toBe(1);

        await page.reload();
        await setPCAConfiguration(b2cMsalConfig, page, screenshot);
        await setRequestConfiguration(tokenRequest, page, screenshot);

        await page.locator("button#btnAcquireTokenSilent").click();
        const response = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        expect(JSON.parse(response || "{}").result.fromCache).toBe(false);
        await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-GotTokens");

        await BrowserCache.verifyTokenStore({
            scopes: tokenRequest.scopes,
        });
    });
});
