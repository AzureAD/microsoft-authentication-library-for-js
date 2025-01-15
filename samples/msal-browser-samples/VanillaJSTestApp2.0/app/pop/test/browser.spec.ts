import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
} from "e2e-test-utils";
import { JWK, JWT } from "jose";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let sampleHomeUrl = "";
let username = "";
let accountPwd = "";

describe("Browser PoP tests", function () {
    let browser: puppeteer.Browser;
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
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

    it("Performs loginRedirect, acquires and validates PoP token", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        // Home Page
        await page.waitForSelector("#SignIn");
        await screenshot.takeScreenshot(page, "samplePageInit");
        // Click Sign In
        await page.click("#SignIn");
        await page.waitForSelector("#loginRedirect");
        await screenshot.takeScreenshot(page, "signInClicked");
        // Click Sign In With Redirect
        await page.click("#loginRedirect");
        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("#popToken", { visible: true });
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        await page.click("#popToken");
        await page.waitForSelector("#PopTokenAcquired");
        await screenshot.takeScreenshot(page, "popTokenClicked");
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        // One Bearer Token and one PoP token
        expect(tokenStore.accessTokens).toHaveLength(2);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        const cachedAccount = await BrowserCache.getAccountFromCache();
        const defaultCachedToken =
            await BrowserCache.popAccessTokenForScopesExists(
                tokenStore.accessTokens,
                ["openid", "profile", "user.read"]
            );
        expect(cachedAccount).toBeDefined();
        expect(defaultCachedToken).toBeTruthy();
        // Check pop token
        const token: string = await page.evaluate(() =>
            window.eval("popToken")
        );
        const decodedToken: any = JWT.decode(token);
        const pubKey = decodedToken.cnf.jwk;
        const pubKeyJwk = JWK.asKey(pubKey);
        expect(JWT.verify(token, pubKeyJwk)).toEqual(decodedToken);
    });

    it("Performs loginRedirect, acquires and verifies a PoP token is unsigned if PoP kid is provided in request", async () => {
        const testName = "redirectBaseCaseWithCnf";
        const screenshot = new Screenshot(
            `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        );
        // Home Page
        await page.waitForSelector("#SignIn");
        await screenshot.takeScreenshot(page, "samplePageInit");
        // Click Sign In
        await page.click("#SignIn");
        await page.waitForSelector("#loginRedirect");
        await screenshot.takeScreenshot(page, "signInClicked");
        // Click Sign In With Redirect
        await page.click("#loginRedirect");
        // Enter credentials
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("#popCnfToken", { visible: true });
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        await page.click("#popCnfToken");
        await page.waitForSelector("#PopTokenWithKidAcquired");
        await screenshot.takeScreenshot(page, "popTokenWithCnfClicked");
        console.log("Waiting for pop token to be generated");
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).toHaveLength(1);
        // One Bearer Token and one PoP token
        expect(tokenStore.accessTokens).toHaveLength(2);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        const cachedAccount = await BrowserCache.getAccountFromCache();
        const defaultCachedToken =
            await BrowserCache.accessTokenForScopesExists(
                tokenStore.accessTokens,
                ["openid", "profile", "user.read"]
            );
        expect(cachedAccount).toBeDefined();
        expect(defaultCachedToken).toBeTruthy();
    });
});
