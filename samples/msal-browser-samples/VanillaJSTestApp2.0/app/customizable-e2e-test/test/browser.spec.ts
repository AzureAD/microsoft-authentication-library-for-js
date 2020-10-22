import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { msalConfig, request } from "../authConfig.json";
import fs from "fs";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const SAMPLE_HOME_URL = "http://localhost:30662/";
let username = "";
let accountPwd = "";

async function enterCredentials(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
}

async function executeLoginRedirect(screenshot: Screenshot, page: puppeteer.Page): Promise<void> {
    // Home Page
    await screenshot.takeScreenshot(page, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
    // Click Sign In With Redirect
    await page.click("#loginRedirect");
    // Enter credentials
    await enterCredentials(page, screenshot);
    // Wait for return to page
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#scopes-acquired");
    await screenshot.takeScreenshot(page, "samplePageLoggedIn");
}

async function executeLoginPopup(screenshot: Screenshot, page: puppeteer.Page): Promise<void> {
    // Home Page
    await screenshot.takeScreenshot(page, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, "signInClicked");
    // Click Sign In With Popup
    const newPopupWindowPromise = new Promise<puppeteer.Page>(resolve => page.once("popup", resolve));
    await page.click("#loginPopup");
    const popupPage = await newPopupWindowPromise;
    const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));
    // Enter credentials
    await enterCredentials(popupPage, screenshot);
    // Wait until popup window closes and see that we are logged in
    await popupWindowClosed;
    await page.waitFor(1000);
    expect(popupPage.isClosed()).to.be.true;
    // Wait for token acquisition
    await page.waitForSelector("#scopes-acquired");
    await screenshot.takeScreenshot(page, "samplePageLoggedIn");
}

describe("Browser tests", function () {
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
        before(async () => {
            const labApiParams: LabApiQueryParams = {
                azureEnvironment: AzureEnvironments.PPE,
                appType: AppTypes.CLOUD
            };
    
            const labClient = new LabClient();
            const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

            [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

            fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig: msalConfig, request: request}));
        });

        describe("login Tests", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
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
                await executeLoginRedirect(screenshot, page);
                const tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).to.be.length(1);
                expect(tokenStore.accessTokens).to.be.length(1);
                expect(tokenStore.refreshTokens).to.be.length(1);
                expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
                expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, request.scopes)).to.be.true;
                const storage = await BrowserCache.getWindowStorage();
                expect(Object.keys(storage).length).to.be.eq(4);
            });
            
            it("Performs loginPopup", async () => {
                const testName = "popupBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                await executeLoginPopup(screenshot, page);
                const tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).to.be.length(1);
                expect(tokenStore.accessTokens).to.be.length(1);
                expect(tokenStore.refreshTokens).to.be.length(1);
                expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
                expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, request.scopes)).to.be.true;
                const storage = await BrowserCache.getWindowStorage();
                expect(Object.keys(storage).length).to.be.eq(4);
            });
        });

        describe("acquireToken Tests", () => {
            let testName: string;
            let screenshot: Screenshot;
            
            before(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
                await page.goto(SAMPLE_HOME_URL);

                testName = "acquireTokenBaseCase";
                screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                await executeLoginPopup(screenshot, page);
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
                let tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.refreshTokens);
                await BrowserCache.removeTokens(tokenStore.accessTokens);
                await page.click("#acquireTokenRedirect");
                await page.waitForNavigation({ waitUntil: "networkidle0"});
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenRedirectGotTokens");

                // Verify we now have an access_token
                tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).to.be.length(1);
                expect(tokenStore.accessTokens).to.be.length(1);
                expect(tokenStore.refreshTokens).to.be.length(1);
                expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
                expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, request.scopes)).to.be.true;
                const storage = await BrowserCache.getWindowStorage();
                expect(Object.keys(storage).length).to.be.eq(4);
            });

            it("acquireTokenPopup", async () => {
                await page.waitForSelector("#acquireTokenPopup");

                // Remove access_tokens from cache so we can verify acquisition
                let tokenStore = await BrowserCache.getTokens();
                await BrowserCache.removeTokens(tokenStore.refreshTokens);
                await BrowserCache.removeTokens(tokenStore.accessTokens);
                await page.click("#acquireTokenPopup");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenPopupGotTokens");

                // Verify we now have an access_token
                tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).to.be.length(1);
                expect(tokenStore.accessTokens).to.be.length(1);
                expect(tokenStore.refreshTokens).to.be.length(1);
                expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
                expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, request.scopes)).to.be.true;
                const storage = await BrowserCache.getWindowStorage();
                expect(Object.keys(storage).length).to.be.eq(4);
            });

            it("acquireTokenSilent from Cache", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                let tokenStore = await BrowserCache.getTokens();
                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

                // Verify we now have an access_token
                tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).to.be.length(1);
                expect(tokenStore.accessTokens).to.be.length(1);
                expect(tokenStore.refreshTokens).to.be.length(1);
                expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
                expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, request.scopes)).to.be.true;

                const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(msalConfig.auth.clientId);
                expect(telemetryCacheEntry).to.not.be.null;
                expect(telemetryCacheEntry["cacheHits"]).to.be.eq(1);
                const storage = await BrowserCache.getWindowStorage();
                expect(Object.keys(storage).length).to.be.eq(5);

                // Remove Telemetry Cache entry for next test
                await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(msalConfig.auth.clientId)]);
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
                tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).to.be.length(1);
                expect(tokenStore.accessTokens).to.be.length(1);
                expect(tokenStore.refreshTokens).to.be.length(1);
                expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
                expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, request.scopes)).to.be.true;
                const storage = await BrowserCache.getWindowStorage();
                expect(Object.keys(storage).length).to.be.eq(4);
            });
        });
    });
});
