import path from "path";
import puppeteer from "puppeteer";
import { JWK, JWT } from "jose";
import { Screenshot, createFolder, setupCredentials, enterCredentials, retrieveAppConfiguration } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes, AppPlatforms, UserTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { getBrowser, getHomeUrl } from "../../testUtils";
import { StringReplacer } from "../../../../../e2eTestUtils/ConfigUtils";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;

const stringReplacer = new StringReplacer(path.join(__dirname, "../authConfig.js"));

describe("Browser tests", function () {
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
        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
        await page.goto(sampleHomeUrl);
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
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
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
        const cachedAccount = await BrowserCache.getAccountFromCache(tokenStore.idTokens[0]);
        const defaultCachedToken = await BrowserCache.popAccessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"]);
        expect(cachedAccount).toBeDefined();
        expect(defaultCachedToken).toBeTruthy();
        // Check pop token
        const token: string = await page.evaluate(() => window.eval("popToken"));
        const decodedToken: any = JWT.decode(token);
        const pubKey = decodedToken.cnf.jwk;
        const pubKeyJwk = JWK.asKey(pubKey);
        expect(JWT.verify(token, pubKeyJwk)).toEqual(decodedToken);

        // Expected 5 since the pop request will fail
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).toEqual(5);
    });
});
