import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    ONE_SECOND_IN_MS,
    clickLoginPopup,
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
    UserTypes,
} from "e2e-test-utils";
import {
    msalConfig as aadMsalConfig,
    request as aadTokenRequest,
    tenants as aadTenants,
} from "../authConfigs/aadMultiTenantAuthConfig.json";
import fs from "fs";
import path from "path";
import { GuestHomedIn } from "e2e-test-utils/src/Constants";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../../../test/screenshots/customizable-e2e-test/browserAADMultiTenant");
let sampleHomeUrl = "";

describe("AAD-Prod Tests", () => {
    // logout Tests beforeEach does a full popup login per test (new context,
    // page.goto, enterCredentials, waitForReturnToApp). On cold agents this
    // can exceed Jest's 30s default hook timeout.
    jest.setTimeout(90000);

    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let username = "";
    let accountPwd = "";
    let guestUsername = "";

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            userType: UserTypes.GUEST,
            guestHomedIn: GuestHomedIn.HOSTAZUREAD,
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
                tenants: aadTenants,
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
            // Each logout test starts from a fresh page; allow extra time for MSAL init
            // before the login step that every test requires.
            await pcaInitializedPoller(page, 10000);

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
            // Allow MSAL to finish processing the login response before the test begins.
            await pcaInitializedPoller(page, 10000);
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
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
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

        it("acquireTokenRedirect from home tenant", async () => {
            testName = "acquireTokenRedirectFromHomeTenant";
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

        it("acquireTokenSilent from cache (home tenant token)", async () => {
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

        it("acquireTokenSilent via RefreshToken (home tenant token)", async () => {
            testName = "acquireTokenSilentRTHome";
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
                "acquireTokenSilent-viaRefresh-home-GotTokens"
            );

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
            });
        });

        it("acquireTokenSilent via RefreshToken (guest tenant token)", async () => {
            testName = "acquireTokenSilentRTGuest";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await page.waitForSelector("#acquireGuestToken");
            await page.click("#acquireGuestToken");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(
                page,
                "acquireTokenSilent-viaRefresh-guest-GotTokens"
            );

            // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
                numberOfTenants: 2,
            });
        });

        it("tenantProfiles accumulate across home and guest tenant authentication", async () => {
            testName = "tenantProfilesAccumulate";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // The previous test already acquired the guest token via RT; both home and guest
            // tokens are now in cache. Just inspect the resulting account state.
            await screenshot.takeScreenshot(page, "tenantProfilesAccumulate-checkState");

            // Evaluate getAllAccounts() inside the page to avoid cache encryption concerns.
            // Use forEach instead of spread to avoid tslib helpers that are unavailable
            // in the puppeteer browser execution context.
            const accountData = await page.evaluate(() => {
                return (window as any).msalApp.getAllAccounts().map((a: any) => {
                    const keys: string[] = [];
                    if (a.tenantProfiles) {
                        a.tenantProfiles.forEach((_: any, k: string) => { keys.push(k); });
                    }
                    return {
                        homeAccountId: a.homeAccountId,
                        tenantId: a.tenantId,
                        tenantProfilesSize: a.tenantProfiles ? a.tenantProfiles.size : 0,
                        tenantProfileKeys: keys,
                    };
                });
            });

            // Should have 2 AccountInfo objects - one per tenant
            expect(accountData).toHaveLength(2);

            // Both should share the same homeAccountId
            expect(accountData[0].homeAccountId).toEqual(accountData[1].homeAccountId);

            // Each AccountInfo should carry both tenant profiles
            for (const account of accountData) {
                expect(account.tenantProfilesSize).toEqual(2);
                expect(account.tenantProfileKeys).toContain(aadTenants.home.tenantId);
                expect(account.tenantProfileKeys).toContain(aadTenants.guest.tenantId);
            }
        });

        it("getActiveAccount returns non-null after cross-tenant token acquisition", async () => {
            testName = "getActiveAccountAfterCrossTenant";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            const activeAccountData = await page.evaluate(() => {
                const account = (window as any).msalApp.getActiveAccount();
                if (!account) return null;
                return {
                    homeAccountId: account.homeAccountId,
                    tenantId: account.tenantId,
                    username: account.username,
                };
            });

            await screenshot.takeScreenshot(page, "getActiveAccount-result");

            expect(activeAccountData).not.toBeNull();
            expect(activeAccountData!.homeAccountId).toBeTruthy();
            // The last token acquired before this test was the guest tenant token (via RT),
            // so handleResponse set the active account to the guest-tenant AccountInfo.
            expect(activeAccountData!.tenantId).toEqual(aadTenants.guest.tenantId);
        });

        it("acquireTokenSilent from cache (guest tenant token)", async () => {
            testName = "acquireTokenSilentCacheGuest";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );
            await page.click("#acquireGuestToken");
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
                numberOfTenants: 2,
            });
        });
    });

    describe("acquireToken Tests (guest-first direction)", () => {
        let testName: string;
        let screenshot: Screenshot;

        beforeAll(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            BrowserCache = new BrowserCacheUtils(
                page,
                aadMsalConfig.cache.cacheLocation
            );
            await page.goto(sampleHomeUrl);

            testName = "acquireTokenGuestFirstBaseCase";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Log in with guest tenant authority first — establishes AccountEntity
            // with guest profile, giving us the reverse of the normal home-first flow.
            await screenshot.takeScreenshot(page, "samplePageInit");
            await page.click("#SignIn");
            await screenshot.takeScreenshot(page, "signInClicked");
            const newPopupWindowPromise = new Promise<puppeteer.Page | null>(resolve =>
                page.once("popup", resolve)
            );
            await page.click("#popupGuest");
            const popupPage = await newPopupWindowPromise;
            const popupWindowClosed = new Promise<void>(resolve =>
                popupPage!.once("close", resolve)
            );
            await enterCredentials(popupPage!, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage!, popupWindowClosed);
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

        it("acquireTokenSilent via RefreshToken (home tenant token, after guest login)", async () => {
            testName = "acquireTokenSilentRTHomeAfterGuestLogin";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // No home AccountInfo exists yet after guest-only login, so getHomeTokenSilently
            // takes the RT path with explicit home authority, calling setCachedAccount
            // and merging the home profile into the AccountEntity.
            await page.click("#acquireHomeToken");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "guestFirst-gotHomeToken");

            await BrowserCache.verifyTokenStore({
                scopes: aadTokenRequest.scopes,
                numberOfTenants: 2,
            });
        });

        it("tenantProfiles accumulate when guest login precedes silent home token acquisition", async () => {
            testName = "tenantProfilesGuestLoginFirst";
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            const accountData = await page.evaluate(() => {
                const accounts = (window as any).msalApp.getAllAccounts();
                return accounts.map((a: any) => {
                    const keys: string[] = [];
                    if (a.tenantProfiles) {
                        a.tenantProfiles.forEach((_: any, k: string) => { keys.push(k); });
                    }
                    return {
                        tenantProfilesSize: a.tenantProfiles ? a.tenantProfiles.size : 0,
                        tenantProfileKeys: keys,
                    };
                });
            });

            await screenshot.takeScreenshot(page, "guestFirst-tenantProfiles");

            expect(accountData).toHaveLength(2);
            for (const account of accountData) {
                expect(account.tenantProfilesSize).toEqual(2);
                expect(account.tenantProfileKeys).toContain(aadTenants.home.tenantId);
                expect(account.tenantProfileKeys).toContain(aadTenants.guest.tenantId);
            }
        });
    });
});
