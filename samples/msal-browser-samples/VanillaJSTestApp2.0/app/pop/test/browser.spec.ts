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
        expect(tokenStore.idTokens).to.be.length(1);
        // One Bearer Token and one PoP token
        expect(tokenStore.accessTokens).to.be.length(2);
        expect(tokenStore.refreshTokens).to.be.length(1);
        const cachedAccount = await BrowserCache.getAccountFromCache(tokenStore.idTokens[0]);
        const defaultCachedToken = await BrowserCache.popAccessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"]);
        expect(cachedAccount).to.not.be.null;
        expect(defaultCachedToken).to.be.true;
        // Check pop token
        const token: string = await page.evaluate(() => window.eval("popToken"));
        const decodedToken: any = JWT.decode(token);
        const pubKey = decodedToken.cnf.jwk;
        const pubKeyJwk = JWK.asKey(pubKey);
        expect(JWT.verify(token, pubKeyJwk)).to.deep.eq(decodedToken);
        
        // Expected 5 since the pop request will fail
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).to.be.eq(5);
    });
});
