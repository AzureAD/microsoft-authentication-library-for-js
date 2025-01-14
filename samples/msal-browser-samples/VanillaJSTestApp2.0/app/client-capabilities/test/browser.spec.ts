import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    storagePoller,
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
import { JWT } from "jose";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let sampleHomeUrl = "";
let username = "";
let accountPwd = "";

describe("Browser tests", function () {
    let browser: puppeteer.Browser;
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };

        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

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

    it("Performs loginRedirect, acquires and validates CAE token", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        // Home Page
        await page.waitForSelector("#SignIn");
        await screenshot.takeScreenshot(page, "samplePageInit");

        // Click Sign In
        await page.click("#SignIn");
        await page.waitForSelector("#redirect");
        await screenshot.takeScreenshot(page, "signInClicked");

        // Click Sign In With Redirect
        await page.click("#redirect");

        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);

        // Fetch profile
        await page.waitForSelector("#seeProfile", { visible: true });
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        await page.click("#seeProfile");
        await page.waitForSelector("#profile-div");
        await screenshot.takeScreenshot(page, "caeTokenClicked");

        // Check token
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        const cachedAccount = await BrowserCache.getAccountFromCache();
        const defaultCachedToken =
            await BrowserCache.accessTokenForScopesExists(
                tokenStore.accessTokens,
                ["openid", "profile", "user.read"]
            );
        expect(cachedAccount).toBeDefined();
        expect(defaultCachedToken).toBeTruthy();

        // Check cae token
        const accessToken = JSON.parse(
            (await BrowserCache.getWindowStorage())[tokenStore.accessTokens[0]]
        ).secret;
        const decodedToken: any = JWT.decode(accessToken);
        expect(decodedToken.xms_cc).toEqual(["CP1"]);
    });

    it("Performs loginRedirect, acquires and validates CAE PoP token", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );

        // Home Page
        await page.waitForSelector("#SignIn");
        await screenshot.takeScreenshot(page, "samplePageInitPop");

        // Click Sign In
        await page.click("#SignIn");
        await page.waitForSelector("#redirect");
        await screenshot.takeScreenshot(page, "signInClickedPop");

        // Click Sign In With Redirect
        await page.click("#redirect");

        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);

        // Click to get cae pop token
        await page.waitForSelector("#seeProfilePop", { visible: true });
        await screenshot.takeScreenshot(page, "samplePageLoggedInPop");
        await page.click("#seeProfilePop");

        // Click to get cae bearer token
        await page.click("#seeProfile");
        await page.waitForSelector("#profile-div p");
        await screenshot.takeScreenshot(page, "caePopTokenClicked");

        // Check for both tokens in cache
        await storagePoller(async () => {
            const tokenStore = await BrowserCache.getTokens();
            expect(tokenStore.accessTokens).toHaveLength(2);
        }, ONE_SECOND_IN_MS * 5);

        const tokenStore = await BrowserCache.getTokens();
        const cachedBearerToken = await BrowserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            ["openid", "profile", "user.read"]
        );
        expect(cachedBearerToken).toBeTruthy();

        const cachedPopToken = await BrowserCache.popAccessTokenForScopesExists(
            tokenStore.accessTokens,
            ["openid", "profile", "user.read"]
        );
        expect(cachedPopToken).toBeTruthy();

        const storage = await BrowserCache.getWindowStorage();
        const caePopTokenKey = tokenStore.accessTokens.find((key) =>
            key.includes("accesstoken_with_authscheme")
        );
        const accessToken = JSON.parse(storage[caePopTokenKey]).secret;

        // Check cae pop token
        const decodedToken: any = JWT.decode(accessToken);
        expect(decodedToken.xms_cc).toEqual(["CP1"]);
        expect(typeof decodedToken.cnf.kid).toEqual("string");
        expect(typeof decodedToken.cnf.xms_ksl).toEqual("string");
    });
});
