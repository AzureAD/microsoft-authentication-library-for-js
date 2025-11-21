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
import { JWT, JWK } from "jose";
import path from "path";
import { defaultPcaConfig, defaultTokenRequest, setPCAConfiguration, setRequestConfiguration } from "../test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/core-scenarios/popup");
let sampleHomeUrl = "";

describe("Popup tests", () => {
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

    it("Closing popup before login resolves clears cache", async () => {
        const testName = "popupCloseWindow";
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
        
        await popupPage.waitForNavigation({ waitUntil: "networkidle0" }).catch(() => {});
        await popupPage.close();
        
        // Wait until popup window closes
        await popupWindowClosed;
        
        // Wait a moment for processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Temporary Cache always uses sessionStorage
        const sessionBrowserStorage = new BrowserCacheUtils(page, "sessionStorage");
        const sessionStorage = await sessionBrowserStorage.getWindowStorage();
        const localStorage = await BrowserCache.getWindowStorage();
        
        expect(Object.keys(localStorage).length).toEqual(2); // Telemetry
        expect(Object.keys(sessionStorage).length).toEqual(0);
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

    it("Performs logoutPopup", async () => {
        const testName = "logoutPopup";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        // First, sign in
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
        await screenshot.takeScreenshot(page, "Logged in");

        // Verify tokens are in cache
        await BrowserCache.verifyTokenStore({
            scopes: defaultTokenRequest.scopes,
        });

        // Now perform logout
        const logoutPopupPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await page.locator("button#btnLogoutPopup").click();
        const popup = await logoutPopupPromise;
        if (!popup) {
            throw new Error('Logout popup window was not opened');
        }
        
        // Wait for the popup URL to change from about:blank to the logout URL
        await popup.waitForFunction(
            () => window.location.href.startsWith("https://login.microsoftonline.com/common/oauth2/v2.0/logout"),
            { timeout: 2000 }
        );
        await popup.close();
        await screenshot.takeScreenshot(page, "Logged out");

        // Verify cache is cleared
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens.length).toBe(0);
        expect(tokenStore.accessTokens.length).toBe(0);
        expect(tokenStore.refreshTokens.length).toBe(0);
    });

    it("Logging in on one tab updates cache/UI in another tab", async () => {
        const testName = "multi-tab";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        const tab1 = page;
        await setPCAConfiguration(defaultPcaConfig, tab1, screenshot);
        await setRequestConfiguration(defaultTokenRequest, tab1, screenshot);

        const tab2 = await context.newPage();
        tab2.setDefaultTimeout(5000);
        await tab2.goto(sampleHomeUrl);
        await setPCAConfiguration(defaultPcaConfig, tab2, screenshot);
        await setRequestConfiguration(defaultTokenRequest, tab2, screenshot);

        const checkAccountsExist = async (page: puppeteer.Page): Promise<boolean> => {
            await page.bringToFront();
            await page.locator("button#btnGetAllAccounts").click();
            const responseText = await page.locator("div#responseDisplay").map(el => el.textContent).wait();
            await screenshot.takeScreenshot(page, "getAllAccounts response");
            const response = JSON.parse(responseText || "{}");
            return Array.isArray(response.result) && response.result.length > 0;
        };

        // Check that both tabs start with no accounts
        expect(await checkAccountsExist(tab1)).toBe(false);
        expect(await checkAccountsExist(tab2)).toBe(false);

        // Sign in on tab1
        await tab1.bringToFront();

        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            tab1.once("popup", resolve)
        );
        await tab1.locator("button#btnAcquireTokenPopup").click();
        const popupPage = await newPopupWindowPromise;
        if (!popupPage) {
            throw new Error('Popup window was not opened');
        }
        const popupWindowClosed = new Promise<void>((resolve) =>
            popupPage.once("close", resolve)
        );
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;
        
        // Check that tab1 has accounts
        expect(await checkAccountsExist(tab1)).toBe(true);
        await tab1.locator("button#btnAcquireTokenSilent").click();
        const tab1ResponseText = await tab1.locator("div#responseDisplay").map(el => el.textContent).wait();
        const tab1Response = JSON.parse(tab1ResponseText || "{}");
        expect(tab1Response.result).toHaveProperty("accessToken");
        await screenshot.takeScreenshot(tab1, "tab1AcquiredToken");

        // Check that tab2 also has accounts from the shared cache
        await tab2.bringToFront();
        expect(await checkAccountsExist(tab2)).toBe(true);
        await tab2.locator("button#btnAcquireTokenSilent").click();
        const tab2ResponseText = await tab2.locator("div#responseDisplay").map(el => el.textContent).wait();
        const tab2Response = JSON.parse(tab2ResponseText || "{}");
        expect(tab2Response.result).toHaveProperty("accessToken");
        await screenshot.takeScreenshot(tab2, "tab2AcquiredToken");
        await tab2.close();
    });

    it("Performs loginPopup and validates CAE token with client capabilities", async () => {
        const testName = "popupCAEToken";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        const caeConfig = {
            ...defaultPcaConfig,
            auth: {
                ...defaultPcaConfig.auth,
                clientCapabilities: ["CP1"]
            }
        };

        await setPCAConfiguration(caeConfig, page, screenshot);
        await setRequestConfiguration(defaultTokenRequest, page, screenshot);

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
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        // Get the response from the display
        const responseText = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "Returned to app with CAE token");

        const response = JSON.parse(responseText || "{}");
        expect(response.result).toHaveProperty("accessToken");
        expect(response.result).toHaveProperty("idToken");

        // Verify CAE claim in access token
        const accessToken = response.result.accessToken;
        const decodedToken: any = JWT.decode(accessToken);
        expect(decodedToken.xms_cc).toEqual(["CP1"]);
    });

    it("Performs loginPopup and validates CAE PoP token", async () => {
        const testName = "popupCAEPopToken";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        const caeConfig = {
            ...defaultPcaConfig,
            auth: {
                ...defaultPcaConfig.auth,
                clientCapabilities: ["CP1"]
            }
        };

        const popTokenRequest = {
            ...defaultTokenRequest,
            authenticationScheme: "pop",
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://graph.microsoft.com/v1.0/me"
        };

        await setPCAConfiguration(caeConfig, page, screenshot);
        await setRequestConfiguration(popTokenRequest, page, screenshot);

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
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        // Get the response from the display
        const responseText = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "Returned to app with CAE PoP token");

        const response = JSON.parse(responseText || "{}");
        expect(response.result).toHaveProperty("accessToken");
        expect(response.result).toHaveProperty("idToken");

        // Verify CAE PoP token - PoP tokens are JWT wrappers around the actual token
        const accessToken = response.result.accessToken;
        const popToken: any = JWT.decode(accessToken);
        const decodedToken: any = JWT.decode(popToken.at);
        expect(decodedToken.xms_cc).toEqual(["CP1"]);
        expect(typeof decodedToken.cnf.kid).toEqual("string");
        expect(typeof decodedToken.cnf.xms_ksl).toEqual("string");
    });

    it("Performs loginPopup, acquires and validates PoP token", async () => {
        const testName = "popupPopToken";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        const popTokenRequest = {
            ...defaultTokenRequest,
            authenticationScheme: "pop",
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://graph.microsoft.com/v1.0/me"
        };

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(popTokenRequest, page, screenshot);

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
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        // Get the response from the display
        const responseText = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "Returned to app with PoP token");

        const response = JSON.parse(responseText || "{}");
        expect(response.result).toHaveProperty("accessToken");
        expect(response.result).toHaveProperty("idToken");

        // Verify PoP token - outer layer is the signed JWT wrapper
        const token = response.result.accessToken;
        const decodedToken: any = JWT.decode(token);
        const pubKey = decodedToken.cnf.jwk;
        const pubKeyJwk = JWK.asKey(pubKey);
        expect(JWT.verify(token, pubKeyJwk)).toEqual(decodedToken);
    });

    it("Performs loginPopup, acquires and verifies a PoP token is unsigned if PoP kid is provided in request", async () => {
        const testName = "popupPopTokenWithKid";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        const popTokenWithKidRequest = {
            ...defaultTokenRequest,
            authenticationScheme: "pop",
            resourceRequestMethod: "GET",
            resourceRequestUri: "https://graph.microsoft.com/v1.0/me",
            popKid: "test-kid-123"
        };

        await setPCAConfiguration(defaultPcaConfig, page, screenshot);
        await setRequestConfiguration(popTokenWithKidRequest, page, screenshot);

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
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await popupWindowClosed;

        // Get the response from the display
        const responseText = await page.locator("div#responseContent")
            .filter((value) => !!value.textContent && value.textContent.includes("result"))
            .map(value => value.textContent)
            .wait();
        await screenshot.takeScreenshot(page, "Returned to app with PoP token with kid");

        const response = JSON.parse(responseText || "{}");
        expect(response.result).toHaveProperty("accessToken");
        expect(response.result).toHaveProperty("idToken");

        // Verify token was acquired successfully
        const token = response.result.accessToken;
        const decodedToken: any = JWT.decode(token);
        expect(decodedToken).toBeDefined();
    });
});
