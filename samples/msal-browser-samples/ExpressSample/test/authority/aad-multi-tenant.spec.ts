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
    UserTypes,
} from "e2e-test-utils";
import path from "path";
import { setPCAConfiguration, setRequestConfiguration } from "../test-helpers";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../screenshots/authority/aad-multi-tenant");
let sampleHomeUrl = "";

// Multi-tenant configuration with guest user
const multiTenantPcaConfig = {
    auth: {
        clientId: "b5c2e510-4a17-4feb-b219-e55aa5b74144",
        authority: "https://login.microsoftonline.com/f645ad92-e38d-4d1a-b510-d1b09a74a8ca",
        redirectUri: "/"
    },
    cache: {
        cacheLocation: "localStorage"
    }
};

const tokenRequest = {
    scopes: ["User.Read"]
};

const homeTenant = {
    tenantId: "f645ad92-e38d-4d1a-b510-d1b09a74a8ca",
    authority: "https://login.microsoftonline.com/f645ad92-e38d-4d1a-b510-d1b09a74a8ca"
};

const guestTenant = {
    tenantId: "8e44f19d-bbab-4a82-b76b-4cd0a6fbc97a",
    authority: "https://login.microsoftonline.com/8e44f19d-bbab-4a82-b76b-4cd0a6fbc97a"
};

describe("AAD Multi-Tenant Tests", () => {
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
            userType: UserTypes.GUEST,
            guestHomedIn: "HostAzureAD" as any,
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
        BrowserCache = new BrowserCacheUtils(page, multiTenantPcaConfig.cache.cacheLocation);
        sampleHomeUrl = `http://localhost:${port}/playground`;
        await page.goto(sampleHomeUrl);
        // Sign in before each logout test
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/logout-setup`
        );
    
        const newPopupWindowPromise = new Promise<puppeteer.Page|null>((resolve) =>
            page.once("popup", resolve)
        );
        await setPCAConfiguration(multiTenantPcaConfig, page, screenshot);
        await setRequestConfiguration(tokenRequest, page, screenshot);
    
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
        await page.locator("button#clearResponse").click();
    });

    afterEach(async () => {
        await page.close();
        await context.close();
    });

    describe("logout Tests", () => {
        it("logoutRedirect", async () => {
            const testName = "logoutRedirect";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await page.locator("button#btnLogoutRedirect").click();
            
            // Wait for redirect to logout page
            await page.waitForFunction(
                () => window.location.href.includes('logout'),
                { timeout: 5000 }
            );
            
            expect(page.url().startsWith(`https://login.microsoftonline.com/${homeTenant.tenantId}/`)).toBeTruthy();
            expect(page.url()).toContain("logout");
            await screenshot.takeScreenshot(page, "On logout page");
            
            // Navigate back to verify cache is cleared
            await page.goto(sampleHomeUrl);
            await setPCAConfiguration(multiTenantPcaConfig, page, screenshot);
            
            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);
        });

        it("logoutPopup", async () => {
            const testName = "logoutPopup";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            const logoutPopupPromise = new Promise<puppeteer.Page|null>((resolve) =>
                page.once("popup", resolve)
            );
            await page.locator("button#btnLogoutPopup").click();
            const popupWindow = await logoutPopupPromise;
            if (!popupWindow) {
                throw new Error('Logout popup window was not opened');
            }
            
            // Wait for the popup to navigate to logout URL
            await popupWindow.waitForFunction(
                () => window.location.href.includes('logout'),
                { timeout: 5000 }
            );
            await screenshot.takeScreenshot(popupWindow, "On logout page");
            
            expect(popupWindow.url().startsWith(`https://login.microsoftonline.com/${homeTenant.tenantId}/`)).toBeTruthy();
            expect(popupWindow.url()).toContain("logout");
            
            await popupWindow.close();
            
            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.idTokens.length).toEqual(0);
            expect(tokenStore.accessTokens.length).toEqual(0);
            expect(tokenStore.refreshTokens.length).toEqual(0);
        });
    });

    describe("acquireToken Tests", () => {
        it("acquireTokenRedirect from home tenant", async () => {
            const testName = "acquireTokenRedirectFromHomeTenant";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Remove access_tokens from cache so we can verify acquisition
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.refreshTokens);
            await BrowserCache.removeTokens(tokenStore.accessTokens);
            
            await page.locator("button#btnAcquireTokenRedirect").click();
            await page.waitForNavigation({ waitUntil: ["networkidle0"]});
            await page.locator("div#responseDisplay").wait();
            await screenshot.takeScreenshot(page, "acquireTokenRedirectGotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: tokenRequest.scopes,
            });
        });

        it("acquireTokenSilent from cache (home tenant token)", async () => {
            const testName = "acquireTokenSilentCache";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            await page.locator("button#btnAcquireTokenSilent").click();
            const response = await page.locator("div#responseContent")
                .filter((value) => !!value.textContent && value.textContent.includes("result"))
                .map(value => value.textContent)
                .wait();
            expect(JSON.parse(response || "{}").result.fromCache).toBe(true);
            await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: tokenRequest.scopes,
            });
        });

        it("acquireTokenSilent via RefreshToken (home tenant token)", async () => {
            const testName = "acquireTokenSilentRTHome";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Remove Access Token from cache to force RT flow
            let tokenKeys = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenKeys.accessTokens);
            tokenKeys = await BrowserCache.getTokens();
            expect(tokenKeys.accessTokens.length).toBe(0);
            expect(tokenKeys.refreshTokens.length).toBe(1);
            await page.reload();

            await setPCAConfiguration(multiTenantPcaConfig, page, screenshot);
            await setRequestConfiguration(tokenRequest, page, screenshot);
            await page.locator("button#btnAcquireTokenSilent").click();
            const response = await page.locator("div#responseContent")
                .filter((value) => !!value.textContent && value.textContent.includes("result"))
                .map(value => value.textContent)
                .wait();
            expect(JSON.parse(response || "{}").result.fromCache).toBe(false);
            await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-home-GotTokens");

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: tokenRequest.scopes,
            });
        });

        it("acquireTokenSilent via RefreshToken (guest tenant token)", async () => {
            const testName = "acquireTokenSilentRTGuest";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Remove Access Token from cache to force RT flow
            let tokenKeys = await BrowserCache.getTokens();
            expect(tokenKeys.idTokens.length).toBe(1);
            expect(tokenKeys.accessTokens.length).toBe(1);
            expect(tokenKeys.refreshTokens.length).toBe(1);
            
            await setPCAConfiguration({
                ...multiTenantPcaConfig,
                auth: {
                    ...multiTenantPcaConfig.auth,
                    authority: guestTenant.authority
                }
            }, page, screenshot);
            await setRequestConfiguration({...tokenRequest, forceRefresh: true}, page, screenshot);

            await page.locator("button#btnAcquireTokenSilent").click();
            const response = await page.locator("div#responseContent")
                .filter((value) => !!value.textContent && value.textContent.includes("result"))
                .map(value => value.textContent)
                .wait();
            expect(JSON.parse(response || "{}").result.fromCache).toBe(false);
            await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-guest-GotTokens");

            // Verify browser cache contains tokens for both tenants
            await BrowserCache.verifyTokenStore({
                scopes: tokenRequest.scopes,
                numberOfTenants: 2,
            });
        });

        it("acquireTokenSilent from cache (guest tenant token)", async () => {
            const testName = "acquireTokenSilentCacheGuest";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Configure for guest tenant and force refresh to get guest tenant token
            await setPCAConfiguration({
                ...multiTenantPcaConfig,
                auth: {
                    ...multiTenantPcaConfig.auth,
                    authority: guestTenant.authority
                }
            }, page, screenshot);
            await setRequestConfiguration({...tokenRequest, forceRefresh: true}, page, screenshot);

            await page.locator("button#btnAcquireTokenSilent").click();
            let response = await page.locator("div#responseContent")
                .filter((value) => !!value.textContent && value.textContent.includes("result"))
                .map(value => value.textContent)
                .wait();
            let authResult = JSON.parse(response || "{result : {}}").result;
            expect(authResult.fromCache).toBe(false);
            await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-guest-GotTokens");
            await page.locator("button#clearResponse").click();

            // Verify browser cache contains tokens for both tenants
            await BrowserCache.verifyTokenStore({
                scopes: tokenRequest.scopes,
                numberOfTenants: 2,
            });

            // Strip idTokenClaims and idToken from account to make it serializable
            const {idToken, idTokenClaims, ...simplifiedAccount} = authResult.account;
            
            await setRequestConfiguration({...tokenRequest, account: simplifiedAccount}, page, screenshot);
            await page.locator("button#btnAcquireTokenSilent").click();
            response = await page.locator("div#responseContent")
                .filter((value) => !!value.textContent && value.textContent.includes("result"))
                .map(value => value.textContent)
                .wait();
            authResult = JSON.parse(response || "{result : {}}").result;
            expect(authResult.fromCache).toBe(true);
            await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-guest-GotTokens");
        });
    });
});
