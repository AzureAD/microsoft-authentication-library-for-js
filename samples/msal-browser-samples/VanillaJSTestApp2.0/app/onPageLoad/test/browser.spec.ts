import path from "path";
import puppeteer from "puppeteer";
import { getBrowser, getHomeUrl } from "../../testUtils";
import { Screenshot, createFolder, setupCredentials, enterCredentials, ONE_SECOND_IN_MS, retrieveAppConfiguration } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, AppPlatforms, UserTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { StringReplacer } from "../../../../../e2eTestUtils/ConfigUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;

const stringReplacer = new StringReplacer(path.join(__dirname, "../authConfig.js"));

describe("On Page Load tests", function () {
    let browser: puppeteer.Browser;
    let sampleHomeUrl = "";
    let clientID: string;
    let authority: string;
    let username = "";
    let accountPwd = "";

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            userType: UserTypes.CLOUD,
            appPlatform: AppPlatforms.SPA,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        [clientID, , authority] = await retrieveAppConfiguration(envResponse[0], labClient, false);

        stringReplacer.replace({
            "ENTER_CLIENT_ID_HERE": clientID,
            "ENTER_TENANT_INFO_HERE": authority.split("/")[3],
        });
    });

    afterAll(async () => {
        stringReplacer.restore();
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
    });

    afterEach(async () => {
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
        await screenshot.takeScreenshot(page, "samplePageReturnedToApp");
        await page.waitForSelector("#signOutButton");
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"])).toBeTruthy();
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).toEqual(5);
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
        await page.waitForSelector("#signOutButton");
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).toBeDefined();
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"])).toBeTruthy();
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).toEqual(5);
    }, 60000);
});
