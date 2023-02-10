import fs from "fs";
import puppeteer from "puppeteer";
import { getBrowser, getHomeUrl } from "./testUtils";
import { Screenshot, createFolder, setupCredentials, enterCredentials, ONE_SECOND_IN_MS } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { msalConfig, apiConfig, request, scenario } from "../authConfigs/onPageLoadAuthConfig.json";


const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let sampleHomeUrl = "";
let username = "";
let accountPwd = "";

describe("On Page Load tests", function () {
    let browser: puppeteer.Browser;
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig, apiConfig, request, scenario}));
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS*5);
        BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
    });

    afterEach(async () => {
        if (msalConfig.cache.cacheLocation === "localStorage") {
            await page.evaluate(() => Object.assign({}, window.localStorage.clear()));
        } else {
            await page.evaluate(() => Object.assign({}, window.sessionStorage.clear()));
        }
        await page.close();
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs loginRedirect on page load", async () => {
        await page.goto(sampleHomeUrl);
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

        // Home Page
        await screenshot.takeScreenshot(page, "samplePageInit");

        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);

        // Wait for return to page
        await page.waitForXPath("//button[contains(., 'Sign Out')]");
        await screenshot.takeScreenshot(page, "samplePageReturnedToApp");
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"])).toBeTruthy();
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).toEqual(4);
    }, 60000);

    it("Performs loginRedirect on page load from a page other than redirectUri", async () => {
        await page.goto(sampleHomeUrl + "?testPage");
        const testName = "navigateToLoginRequestUrl";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

        // Home Page
        await screenshot.takeScreenshot(page, "samplePageInit");

        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);

        // Wait for return to page
        await screenshot.takeScreenshot(page, "samplePageReturnedToApp");
        await page.waitForXPath("//button[contains(., 'Sign Out')]");
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        const tokenStore = await BrowserCache.getTokens();

        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"])).toBeTruthy();
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).toEqual(4);
    }, 60000);
});
