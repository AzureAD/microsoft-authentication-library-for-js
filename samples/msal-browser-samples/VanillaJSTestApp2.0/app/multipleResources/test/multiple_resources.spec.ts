import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    ONE_SECOND_IN_MS,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
} from "e2e-test-utils";
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

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
        await page.goto(sampleHomeUrl);
        await pcaInitializedPoller(page, 5000);
    });

    afterEach(async () => {
        await page.close();
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs loginRedirect and acquires 2 tokens", async () => {
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/multipleResources`
        );
        // Home Page
        await screenshot.takeScreenshot(page, "samplePageInit");
        // Click Sign In
        await page.click("#SignIn");
        await screenshot.takeScreenshot(page, "signInClicked");
        // Click Sign In With Redirect
        await page.click("#loginRedirect");
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
        expect(
            BrowserCache.getAccountFromCache()
        ).toBeDefined();

        // acquire First Access Token
        await BrowserCache.removeTokens(tokenStore.accessTokens);
        await page.click("#seeProfile");
        await page.waitForXPath("//p[contains(., 'Phone:')]");
        await screenshot.takeScreenshot(page, "seeProfile");
        tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(
            await BrowserCache.getAccountFromCache()
        ).toBeDefined();
        expect(
            await BrowserCache.accessTokenForScopesExists(
                tokenStore.accessTokens,
                ["openid", "profile", "User.Read"]
            )
        ).toBeTruthy();

        // acquire Second Access Token
        await page.click("#secondToken");
        await page.waitForSelector("#second-resource-div");
        await screenshot.takeScreenshot(page, "secondToken");
        tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(2);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(
            await BrowserCache.getAccountFromCache()
        ).toBeDefined();
        expect(
            await BrowserCache.accessTokenForScopesExists(
                tokenStore.accessTokens,
                ["openid", "profile", "User.Read"]
            )
        ).toBeTruthy();
        expect(
            await BrowserCache.accessTokenForScopesExists(
                tokenStore.accessTokens,
                ["https://msidlab0.spoppe.com/User.Read"]
            )
        ).toBeTruthy();
    });
});
