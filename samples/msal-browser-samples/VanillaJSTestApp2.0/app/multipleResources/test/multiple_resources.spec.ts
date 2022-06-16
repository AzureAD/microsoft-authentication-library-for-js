import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, enterCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
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
        await page.goto("http://localhost:30662/");
    });

    afterEach(async () => {
        await page.close();
    });

    after(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs loginRedirect and acquires 2 tokens", async () => {
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/multipleResources`);
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
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;

        // acquire First Access Token
        await BrowserCache.removeTokens(tokenStore.accessTokens);
        await page.click("#seeProfile");
        await page.waitForXPath("//p[contains(., 'Phone:')]");
        await screenshot.takeScreenshot(page, "seeProfile");
        tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "User.Read"])).to.be.true;

        // acquire Second Access Token
        await page.click("#secondToken");
        await page.waitForSelector("#second-resource-div");
        await screenshot.takeScreenshot(page, "secondToken");
        tokenStore = await BrowserCache.getTokens();
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(2);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "User.Read"])).to.be.true;
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["https://msidlab0.spoppe.com/User.Read"])).to.be.true;
    });
});
