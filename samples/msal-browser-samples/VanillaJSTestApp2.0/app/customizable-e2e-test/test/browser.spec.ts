import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, enterCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, UserTypes, B2cProviders } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { msalConfig as aadMsalConfig, request as aadTokenRequest } from "../authConfigs/aadAuthConfig.json";
import { msalConfig as b2cMsalConfig, request as b2cTokenRequest } from "../authConfigs/b2cAuthConfig.json";
import { b2cAadPpeEnterCredentials, b2cLocalAccountEnterCredentials, clickLoginPopup, clickLoginRedirect, clickLogoutPopup, clickLogoutRedirect, waitForReturnToApp } from "./testUtils";
import fs from "fs";
import { RedirectRequest } from "../../../../../../lib/msal-browser/src";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/default tests`;
const SAMPLE_HOME_URL = "http://localhost:30662/";

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens).to.be.length(1);
    expect(tokenStore.accessTokens).to.be.length(1);
    expect(tokenStore.refreshTokens).to.be.length(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).to.be.true;
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).to.be.eq(4);
}

describe("Default tests", function () {
    this.timeout(0);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"]
        });
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;

    after(async () => {
        await context.close();
        await browser.close();
    });

    describe("AAD-PPE Tests", async () => {
        let username = "";
        let accountPwd = "";
        before(async () => {
            const labApiParams: LabApiQueryParams = {
                azureEnvironment: AzureEnvironments.PPE,
                appType: AppTypes.CLOUD
            };
    
            const labClient = new LabClient();
            const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

            [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

            fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig: aadMsalConfig, request: aadTokenRequest}));
        });

        describe("login Tests", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                BrowserCache = new BrowserCacheUtils(page, aadMsalConfig.cache.cacheLocation);
                await page.goto(SAMPLE_HOME_URL);
            });
        
            afterEach(async () => {
                await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
                await page.close();
            });
    
            it("Performs loginRedirect", async () => {
                const testName = "redirectBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await enterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);
                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });

            it("Performs loginRedirect from url with empty query string", async () => {
                await page.goto(SAMPLE_HOME_URL + "?");
                const testName = "redirectEmptyQueryString";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await enterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);
                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
                expect(page.url()).to.be.eq(SAMPLE_HOME_URL);
            });

            it("Performs loginRedirect from url with test query string", async () => {
                const testUrl = SAMPLE_HOME_URL + "?test";
                await page.goto(testUrl);
                const testName = "redirectEmptyQueryString";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await enterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);
                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
                expect(page.url()).to.be.eq(testUrl);
            });

            it("Performs loginRedirect with relative redirectUri", async () => {
                const relativeRedirectUriRequest: RedirectRequest = {
                    ...aadTokenRequest,
                    redirectUri: "/"
                }
                fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig: aadMsalConfig, request: relativeRedirectUriRequest}));
                page.reload();

                const testName = "redirectBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await enterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);
                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });

            it("Performs loginRedirect with relative redirectStartPage", async () => {
                const relativeRedirectUriRequest: RedirectRequest = {
                    ...aadTokenRequest,
                    redirectStartPage: "/"
                }
                fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig: aadMsalConfig, request: relativeRedirectUriRequest}));
                page.reload();

                const testName = "redirectBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await enterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);
                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });
            
            it("Performs loginPopup", async () => {
                const testName = "popupBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                await enterCredentials(popupPage, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });
        });

        describe("logout Tests", () => {
            let testName: string;
            let screenshot: Screenshot;
            
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                BrowserCache = new BrowserCacheUtils(page, aadMsalConfig.cache.cacheLocation);
                await page.goto(SAMPLE_HOME_URL);

                testName = "logoutBaseCase";
                screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                await enterCredentials(popupPage, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);
            });

            afterEach(async () => {
                await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
                await page.close();
            });

            it("logoutRedirect", async () => {
                await clickLogoutRedirect(screenshot, page);
                expect(page.url().startsWith("https://login.windows-ppe.net/common/")).to.be.true;
                expect(page.url()).to.contain("logout");
                // Skip server sign-out
                await page.goto(SAMPLE_HOME_URL);
                const tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens.length).to.be.eq(0);
                expect(tokenStore.accessTokens.length).to.be.eq(0);
                expect(tokenStore.refreshTokens.length).to.be.eq(0);
            });

            it("logoutPopup", async () => {
                const [popupWindow, popupWindowClosed] = await clickLogoutPopup(screenshot, page);
                await popupWindow.waitForNavigation();
                expect(popupWindow.url().startsWith("https://login.windows-ppe.net/common/")).to.be.true;
                expect(popupWindow.url()).to.contain("logout");
                const tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens.length).to.be.eq(0);
                expect(tokenStore.accessTokens.length).to.be.eq(0);
                expect(tokenStore.refreshTokens.length).to.be.eq(0);
            });
        });

        describe("acquireToken Tests", () => {
            let testName: string;
            let screenshot: Screenshot;
            
            before(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                BrowserCache = new BrowserCacheUtils(page, aadMsalConfig.cache.cacheLocation);
                await page.goto(SAMPLE_HOME_URL);

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
        
            after(async () => {
                await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
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
                await screenshot.takeScreenshot(page, "acquireTokenRedirectGotTokens");

                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });

            it("acquireTokenPopup", async () => {
                await page.waitForSelector("#acquireTokenPopup");

                // Remove access_tokens from cache so we can verify acquisition
                const tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.refreshTokens);
                await BrowserCache.removeTokens(tokenStore.accessTokens);
                await page.click("#acquireTokenPopup");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");

                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });

            it("acquireTokenSilent from Cache", async () => {
                await page.waitForSelector("#acquireTokenSilent");
                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

                const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(aadMsalConfig.auth.clientId);
                expect(telemetryCacheEntry).to.not.be.null;
                expect(telemetryCacheEntry["cacheHits"]).to.be.eq(1);
                // Remove Telemetry Cache entry for next test
                await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(aadMsalConfig.auth.clientId)]);

                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });

            it("acquireTokenSilent via RefreshToken", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                // Remove access_tokens from cache so we can verify acquisition
                const tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.accessTokens);

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-GotTokens");

                // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
                await verifyTokenStore(BrowserCache, aadTokenRequest.scopes);
            });
        });
    });

    describe("B2C Tests", async () => {
        let username = "";
        let accountPwd = "";

        before(() => {
            fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig: b2cMsalConfig, request: b2cTokenRequest}));
        });

        describe("AAD Account", () => {
            before(async () => {
                const labApiParams: LabApiQueryParams = {
                    azureEnvironment: AzureEnvironments.CLOUD,
                    appType: AppTypes.CLOUD
                };
        
                const labClient = new LabClient();
                const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
    
                [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
            });

            describe("login Tests", () => {
                beforeEach(async () => {
                    context = await browser.createIncognitoBrowserContext();
                    page = await context.newPage();
                    BrowserCache = new BrowserCacheUtils(page, b2cMsalConfig.cache.cacheLocation);
                    await page.goto(SAMPLE_HOME_URL);
                });
            
                afterEach(async () => {
                    await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                    await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
                    await page.close();
                });
        
                it("Performs loginRedirect", async () => {
                    const testName = "b2cRedirectBaseCase";
                    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                    await clickLoginRedirect(screenshot, page);
                    await b2cAadPpeEnterCredentials(page, screenshot, username, accountPwd);
                    await waitForReturnToApp(screenshot, page);

                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
                
                it("Performs loginPopup", async () => {
                    const testName = "b2cPopupBaseCase";
                    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                    const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                    await b2cAadPpeEnterCredentials(popupPage, screenshot, username, accountPwd);
                    await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
            });
    
            describe("acquireToken Tests", () => {
                let testName: string;
                let screenshot: Screenshot;
                
                before(async () => {
                    context = await browser.createIncognitoBrowserContext();
                    page = await context.newPage();
                    BrowserCache = new BrowserCacheUtils(page, b2cMsalConfig.cache.cacheLocation);
                    await page.goto(SAMPLE_HOME_URL);
    
                    testName = "b2cAcquireTokenBaseCase";
                    screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                    
                    const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                    await b2cAadPpeEnterCredentials(popupPage, screenshot, username, accountPwd);
                    await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);
                });
    
                beforeEach(async () => {
                    await page.reload();
                    await page.waitForSelector("#WelcomeMessage");
                });
            
                after(async () => {
                    await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                    await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
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
                    await screenshot.takeScreenshot(page, "acquireTokenRedirectGotTokens");
    
                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
    
                it("acquireTokenPopup", async () => {
                    await page.waitForSelector("#acquireTokenPopup");
    
                    // Remove access_tokens from cache so we can verify acquisition
                    const tokenStore = await BrowserCache.getTokens();
                    await BrowserCache.removeTokens(tokenStore.refreshTokens);
                    await BrowserCache.removeTokens(tokenStore.accessTokens);
                    await page.click("#acquireTokenPopup");
                    await page.waitForSelector("#scopes-acquired");
                    await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");
    
                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
    
                it("acquireTokenSilent from Cache", async () => {
                    await page.waitForSelector("#acquireTokenSilent");
    
                    await page.click("#acquireTokenSilent");
                    await page.waitForSelector("#scopes-acquired");
                    await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");
    
                    const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(b2cMsalConfig.auth.clientId);
                    expect(telemetryCacheEntry).to.not.be.null;
                    expect(telemetryCacheEntry["cacheHits"]).to.be.eq(1);
                    // Remove Telemetry Cache entry for next test
                    await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(b2cMsalConfig.auth.clientId)]);

                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
    
                it("acquireTokenSilent via RefreshToken", async () => {
                    await page.waitForSelector("#acquireTokenSilent");
    
                    // Remove access_tokens from cache so we can verify acquisition
                    let tokenStore = await BrowserCache.getTokens();
                    await BrowserCache.removeTokens(tokenStore.accessTokens);
    
                    await page.click("#acquireTokenSilent");
                    await page.waitForSelector("#scopes-acquired");
                    await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-GotTokens");
    
                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
            });
        });

        describe("Local Account", () => {
            before(async () => {
                const labApiParams: LabApiQueryParams = {
                    userType: UserTypes.B2C,
                    b2cProvider: B2cProviders.LOCAL
                };
        
                const labClient = new LabClient();
                const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
    
                [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
            });

            describe("login Tests", () => {
                beforeEach(async () => {
                    context = await browser.createIncognitoBrowserContext();
                    page = await context.newPage();
                    BrowserCache = new BrowserCacheUtils(page, b2cMsalConfig.cache.cacheLocation);
                    await page.goto(SAMPLE_HOME_URL);
                });
            
                afterEach(async () => {
                    await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                    await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
                    await page.close();
                });
        
                it("Performs loginRedirect", async () => {
                    const testName = "b2cRedirectLocalAccountCase";
                    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                    await clickLoginRedirect(screenshot, page);
                    await b2cLocalAccountEnterCredentials(page, screenshot, username, accountPwd);
                    await waitForReturnToApp(screenshot, page);

                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
                
                it("Performs loginPopup", async () => {
                    const testName = "b2cPopupLocalAccountCase";
                    const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                    const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                    await b2cLocalAccountEnterCredentials(popupPage, screenshot, username, accountPwd);
                    await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
            });
    
            describe("acquireToken Tests", () => {
                let testName: string;
                let screenshot: Screenshot;
                
                before(async () => {
                    context = await browser.createIncognitoBrowserContext();
                    page = await context.newPage();
                    BrowserCache = new BrowserCacheUtils(page, b2cMsalConfig.cache.cacheLocation);
                    await page.goto(SAMPLE_HOME_URL);
    
                    testName = "b2cAcquireTokenLocalAccountCase";
                    screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                    
                    const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                    await b2cLocalAccountEnterCredentials(popupPage, screenshot, username, accountPwd);
                    await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);
                });
    
                beforeEach(async () => {
                    await page.reload();
                    await page.waitForSelector("#WelcomeMessage");
                });
            
                after(async () => {
                    await page.evaluate(() =>  Object.assign({}, window.sessionStorage.clear()));
                    await page.evaluate(() =>  Object.assign({}, window.localStorage.clear()));
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
                    await screenshot.takeScreenshot(page, "acquireTokenRedirectGotTokens");
    
                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
    
                it("acquireTokenPopup", async () => {
                    await page.waitForSelector("#acquireTokenPopup");
    
                    // Remove access_tokens from cache so we can verify acquisition
                    const tokenStore = await BrowserCache.getTokens();
                    await BrowserCache.removeTokens(tokenStore.refreshTokens);
                    await BrowserCache.removeTokens(tokenStore.accessTokens);
                    await page.click("#acquireTokenPopup");
                    await page.waitForSelector("#scopes-acquired");
                    await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");
    
                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
    
                it("acquireTokenSilent from Cache", async () => {
                    await page.waitForSelector("#acquireTokenSilent");
    
                    await page.click("#acquireTokenSilent");
                    await page.waitForSelector("#scopes-acquired");
                    await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");
    
                    const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(b2cMsalConfig.auth.clientId);
                    expect(telemetryCacheEntry).to.not.be.null;
                    expect(telemetryCacheEntry["cacheHits"]).to.be.eq(1);
                    // Remove Telemetry Cache entry for next test
                    await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(b2cMsalConfig.auth.clientId)]);

                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
    
                it("acquireTokenSilent via RefreshToken", async () => {
                    await page.waitForSelector("#acquireTokenSilent");
    
                    // Remove access_tokens from cache so we can verify acquisition
                    let tokenStore = await BrowserCache.getTokens();
                    await BrowserCache.removeTokens(tokenStore.accessTokens);
    
                    await page.click("#acquireTokenSilent");
                    await page.waitForSelector("#scopes-acquired");
                    await screenshot.takeScreenshot(page, "acquireTokenSilent-viaRefresh-GotTokens");
    
                    // Verify we now have an access_token
                    await verifyTokenStore(BrowserCache, b2cTokenRequest.scopes);
                });
            });
        });
    });
});
