import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, enterCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { JWK, JWT } from "jose";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const SAMPLE_HOME_URL = "http://localhost:30662/";
let username = "";
let accountPwd = "";

describe("Browser tests", function () {
    this.timeout(0);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParams);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
        
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"]
        });
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
        await page.goto(SAMPLE_HOME_URL);
    });

    afterEach(async () => {
        await page.close();
    });

    after(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs loginRedirect, acquires and validates CAE token", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

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
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        const cachedAccount = await BrowserCache.getAccountFromCache(tokenStore.idTokens[0]);
        const defaultCachedToken = await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"]);
        expect(cachedAccount).to.not.be.null;
        expect(defaultCachedToken).to.be.true;
        
        // Check cae token
        const accessToken = JSON.parse((await BrowserCache.getWindowStorage())[(tokenStore.accessTokens[0])]).secret;
        const decodedToken: any = JWT.decode(accessToken);
        expect(decodedToken.xms_cc).to.deep.equal([ "CP1" ]);
    });

    it("Performs loginRedirect, acquires and validates CAE PoP token", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

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
        await page.waitForTimeout(5000);
        const tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.accessTokens).to.be.length(2);

        const cachedBearerToken = await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"]);
        expect(cachedBearerToken).to.be.true;

        const cachedPopToken = await BrowserCache.popAccessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"]);
        expect(cachedPopToken).to.be.true;

        const storage = await BrowserCache.getWindowStorage();
        const caePopTokenKey = tokenStore.accessTokens.find(key => key.includes("accesstoken_with_authscheme"));
        const accessToken = JSON.parse(storage[caePopTokenKey]).secret;

        // Check cae pop token
        const decodedToken: any = JWT.decode(accessToken);
        expect(decodedToken.xms_cc).to.deep.equal([ "CP1" ]);
        expect(decodedToken.cnf.kid).to.be.string;
        expect(decodedToken.cnf.xms_ksl).to.be.string;
    });
});
