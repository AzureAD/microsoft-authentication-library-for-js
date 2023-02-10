import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials, enterCredentials, ONE_SECOND_IN_MS } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { getBrowser, getHomeUrl } from "../../testUtils";
import { clickLoginRedirect } from "./testUtils";
import { msalConfig, apiConfig, request } from "../authConfigs/multipleResourcesAuthConfig.json";

const fs = require('fs');

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let username = "";
let accountPwd = "";
let sampleHomeUrl = "";

describe("Browser tests", function () {
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

        fs.writeFileSync("./app/customizable-e2e-test/testConfig.json", JSON.stringify({msalConfig, apiConfig, request}));
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
        BrowserCache = new BrowserCacheUtils(page, msalConfig.cache.cacheLocation);
        await page.goto(sampleHomeUrl);
    });

    afterEach(async () => {
        await page.close();
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs loginRedirect and acquires 2 tokens", async () => {
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/multipleResources`);
        // Click Sign In With Redirect
        await clickLoginRedirect(screenshot, page);
        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);
        // Wait for return to page
        await screenshot.takeScreenshot(page, "samplePageReturnedToApp");
        await page.waitForXPath("//button[contains(., 'Sign Out')]");
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        let tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();

        // acquire First Access Token
        await BrowserCache.removeTokens(tokenStore.accessTokens);
        await page.click("#seeProfile");
        await page.waitForXPath("//p[contains(., 'Phone:')]");
        await screenshot.takeScreenshot(page, "seeProfile");
        tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "User.Read"])).toBeTruthy();

        // acquire Second Access Token
        await page.click("#secondToken");
        await page.waitForSelector("#second-resource-div");
        await screenshot.takeScreenshot(page, "secondToken");
        tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(2);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "User.Read"])).toBeTruthy();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["https://msidlab0.spoppe.com/User.Read"])).toBeTruthy();
    });
});
