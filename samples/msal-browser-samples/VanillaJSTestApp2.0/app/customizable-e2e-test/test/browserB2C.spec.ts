import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials, ONE_SECOND_IN_MS } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, UserTypes, B2cProviders } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { Configuration } from "../../../../../../lib/msal-browser/src";
import { b2cAadPpeEnterCredentials, b2cLocalAccountEnterCredentials, clickLoginPopup, clickLoginRedirect, waitForReturnToApp } from "./testUtils";
import fs from "fs";
import { getBrowser, getHomeUrl } from "../../testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots/default tests`;
let sampleHomeUrl = "";

async function verifyTokenStore(BrowserCache: BrowserCacheUtils, scopes: string[]): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens).toHaveLength(1);
    expect(tokenStore.accessTokens).toHaveLength(1);
    expect(tokenStore.refreshTokens).toHaveLength(1);
    expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
    expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, scopes)).toBeTruthy();
    const storage = await BrowserCache.getWindowStorage();
    expect(Object.keys(storage).length).toEqual(4);
}

describe("B2C Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let username = "";
    let accountPwd = "";
    let msalConfig: Configuration;
    let request: any;

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        msalConfig = {
            auth: {
                clientId: "4c837770-7a2b-471e-aafa-3328d04a23b1",
                authority: "https://msidlabb2c.b2clogin.com/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy/",
                knownAuthorities: ["msidlabb2c.b2clogin.com"]
            },
            cache: {
                cacheLocation: "sessionStorage",
                storeAuthStateInCookie: false
            }
        };

        request = {
            scopes: ["https://msidlabb2c.onmicrosoft.com/4c837770-7a2b-471e-aafa-3328d04a23b1/read"]
        }


        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({ msalConfig: msalConfig, request: request }));
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({}));
    });

    describe("AAD Account", () => {
        beforeAll(async () => {
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
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
                await page.goto(sampleHomeUrl);
            });

            afterEach(async () => {
                await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
                await page.close();
            });

            it("Performs loginRedirect", async () => {
                const testName = "b2cRedirectBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await b2cAadPpeEnterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);

                await verifyTokenStore(BrowserCache, request.scopes);
            });

            it("Performs loginPopup", async () => {
                const testName = "b2cPopupBaseCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                await b2cAadPpeEnterCredentials(popupPage, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

                await verifyTokenStore(BrowserCache, request.scopes);
            });
        });

        describe("acquireToken Tests", () => {
            let testName: string;
            let screenshot: Screenshot;

            beforeAll(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
                await page.goto(sampleHomeUrl);

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

            afterAll(async () => {
                await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
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
                await verifyTokenStore(BrowserCache, request.scopes);
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
                await verifyTokenStore(BrowserCache, request.scopes);
            });

            it("acquireTokenSilent from Cache", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

                const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(msalConfig.auth.clientId);
                expect(telemetryCacheEntry).toBeDefined();
                expect(telemetryCacheEntry["cacheHits"]).toEqual(1);
                // Remove Telemetry Cache entry for next test
                await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(msalConfig.auth.clientId)]);

                // Verify we now have an access_token
                await verifyTokenStore(BrowserCache, request.scopes);
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
                await verifyTokenStore(BrowserCache, request.scopes);
            });
        });
    });

    describe("Local Account", () => {
        beforeAll(async () => {
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
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
                await page.goto(sampleHomeUrl);
            });

            afterEach(async () => {
                await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
                await page.close();
            });

            it("Performs loginRedirect", async () => {
                const testName = "b2cRedirectLocalAccountCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                await clickLoginRedirect(screenshot, page);
                await b2cLocalAccountEnterCredentials(page, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page);

                await verifyTokenStore(BrowserCache, request.scopes);
            });

            it("Performs loginPopup", async () => {
                const testName = "b2cPopupLocalAccountCase";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

                const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
                await b2cLocalAccountEnterCredentials(popupPage, screenshot, username, accountPwd);
                await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

                await verifyTokenStore(BrowserCache, request.scopes);
            });
        });

        describe("acquireToken Tests", () => {
            let testName: string;
            let screenshot: Screenshot;

            beforeAll(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
                BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
                await page.goto(sampleHomeUrl);

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

            afterAll(async () => {
                await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
                await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
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
                await verifyTokenStore(BrowserCache, request.scopes);
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
                await verifyTokenStore(BrowserCache, request.scopes);
            });

            it("acquireTokenSilent from Cache", async () => {
                await page.waitForSelector("#acquireTokenSilent");

                await page.click("#acquireTokenSilent");
                await page.waitForSelector("#scopes-acquired");
                await screenshot.takeScreenshot(page, "acquireTokenSilent-fromCache-GotTokens");

                const telemetryCacheEntry = await BrowserCache.getTelemetryCacheEntry(msalConfig.auth.clientId);
                expect(telemetryCacheEntry).toBeDefined();
                expect(telemetryCacheEntry["cacheHits"]).toEqual(1);
                // Remove Telemetry Cache entry for next test
                await BrowserCache.removeTokens([BrowserCacheUtils.getTelemetryKey(msalConfig.auth.clientId)]);

                // Verify we now have an access_token
                await verifyTokenStore(BrowserCache, request.scopes);
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
                await verifyTokenStore(BrowserCache, request.scopes);
            });
        });
    });
});
