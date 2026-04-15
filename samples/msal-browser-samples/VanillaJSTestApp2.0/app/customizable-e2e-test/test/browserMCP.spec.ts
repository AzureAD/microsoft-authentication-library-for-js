import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    ONE_SECOND_IN_MS,
    clickLoginPopup,
    clickLoginRedirect,
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
    msalConfig as mcpMsalConfig,
    request as mcpTokenRequest,
} from "../authConfigs/mcpAuthConfig.json";
import fs from "fs";
import path from "path";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "../../../test/screenshots/customizable-e2e-test/browserMCP");
let sampleHomeUrl = "";

describe("MCP Tests", () => {
    jest.setTimeout(90000);

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
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        fs.writeFileSync(
            "./app/customizable-e2e-test/testConfig.json",
            JSON.stringify({
                msalConfig: mcpMsalConfig,
                request: mcpTokenRequest,
            })
        );
    });

    afterAll(async () => {
        await browser.close();
    });


    const setupPage = async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
        BrowserCache = new BrowserCacheUtils(page, mcpMsalConfig.cache.cacheLocation);
        await page.goto(sampleHomeUrl);
        await pcaInitializedPoller(page, 5000);
    };

    const setupPageAndLogin = async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
        BrowserCache = new BrowserCacheUtils(page, mcpMsalConfig.cache.cacheLocation);
        await page.goto(sampleHomeUrl);

        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/mcpBaseCase`);
        const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
        await enterCredentials(popupPage, screenshot, username, accountPwd);
        await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);
        await page.reload();
        await page.waitForSelector("#WelcomeMessage");
        await pcaInitializedPoller(page, 5000);
    };


    const teardownPage = async () => {
        await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
        await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
        await page.close();
        await context.close();
    };

    describe("acquireTokenSilent", () => {
        beforeEach(setupPageAndLogin);
        afterEach(teardownPage);
        afterEach(async () => {
            fs.writeFileSync(
                "./app/customizable-e2e-test/testConfig.json",
                JSON.stringify({
                    msalConfig: mcpMsalConfig,
                    request: mcpTokenRequest,
                })
            );
        });

        it("acquireTokenSilent from cache with matching resource", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/mcpAcquireTokenSilentCache`);

            await page.waitForSelector("#acquireTokenSilent");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "mcpAcquireTokenSilentCache-GotTokens");

            const fromCache = await page.$eval("#fromCache", (el) => el.textContent);
            expect(fromCache).toContain("true");

            await BrowserCache.verifyTokenStore({ scopes: mcpTokenRequest.scopes });
        });

        it("acquireTokenSilent via RefreshToken stores resource on new access token", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/mcpAcquireTokenSilentRT`);

            await page.waitForSelector("#acquireTokenSilent");

            // Remove access tokens to force refresh token usage
            const tokenStore = await BrowserCache.getTokens();
            await BrowserCache.removeTokens(tokenStore.accessTokens);

            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "mcpAcquireTokenSilentRT-GotTokens");

            const fromCache = await page.$eval("#fromCache", (el) => el.textContent);
            expect(fromCache).toContain("false");

            const storage = await BrowserCache.getWindowStorage();
            const newTokenStore = await BrowserCache.getTokens();
            const cachedAt = JSON.parse(storage[newTokenStore.accessTokens[0]]);
            expect(cachedAt.resource).toEqual(mcpTokenRequest.resource);
        });

        it("acquireTokenSilent with different resource falls back to network", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/mcpAcquireTokenSilentDifferentResource`);

            const differentResourceRequest = {
                ...mcpTokenRequest,
                resource: "https://differentexample.microsoft.com",
            };

            fs.writeFileSync(
                "./app/customizable-e2e-test/testConfig.json",
                JSON.stringify({
                    msalConfig: mcpMsalConfig,
                    request: differentResourceRequest,
                })
            );

            await page.reload();
            await page.waitForSelector("#WelcomeMessage");
            await pcaInitializedPoller(page, 5000);

            await page.waitForSelector("#acquireTokenSilent");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#scopes-acquired");
            await screenshot.takeScreenshot(page, "mcpAcquireTokenSilentDifferentResource-GotTokens");

            const fromCache = await page.$eval("#fromCache", (el) => el.textContent);
            expect(fromCache).toContain("false");

            const storage = await BrowserCache.getWindowStorage();
            const newTokenStore = await BrowserCache.getTokens();
            const newCachedAt = newTokenStore.accessTokens
                .map((key) => JSON.parse(storage[key]))
                .find((at) => at.resource === differentResourceRequest.resource);
            expect(newCachedAt).toBeDefined();
        });
    });

    describe("acquireTokenPopup", () => {
        beforeEach(setupPage);
        afterEach(teardownPage);

        it("acquireTokenPopup stores resource on cached access token", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/mcpAcquireTokenPopup`);

            const [popupPage, popupWindowClosed] = await clickLoginPopup(screenshot, page);
            await enterCredentials(popupPage, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page, popupPage, popupWindowClosed);

            const storage = await BrowserCache.getWindowStorage();
            const newTokenStore = await BrowserCache.getTokens();
            expect(newTokenStore.accessTokens).toHaveLength(1);

            const cachedAt = JSON.parse(storage[newTokenStore.accessTokens[0]]);
            expect(cachedAt.resource).toEqual(mcpTokenRequest.resource);
        });
    });

    describe("acquireTokenRedirect", () => {
        beforeEach(setupPage);
        afterEach(teardownPage);

        it("acquireTokenRedirect stores resource on cached access token", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/mcpAcquireTokenRedirect`);

            await clickLoginRedirect(screenshot, page);
            await enterCredentials(page, screenshot, username, accountPwd);
            await waitForReturnToApp(screenshot, page);

            const storage = await BrowserCache.getWindowStorage();
            const newTokenStore = await BrowserCache.getTokens();
            expect(newTokenStore.accessTokens).toHaveLength(1);

            const cachedAt = JSON.parse(storage[newTokenStore.accessTokens[0]]);
            expect(cachedAt.resource).toEqual(mcpTokenRequest.resource);
        });
    });
});
