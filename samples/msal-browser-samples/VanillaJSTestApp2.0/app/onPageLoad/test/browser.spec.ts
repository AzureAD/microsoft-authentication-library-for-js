import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, enterCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { BrowserCacheUtils } from "../../../../../e2eTestUtils/BrowserCacheTestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const SAMPLE_HOME_URL = "http://localhost:30662/";
let username = "";
let accountPwd = "";

describe("On Page Load tests", function () {
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
    });

    afterEach(async () => {
        await page.close();
    });

    after(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs loginRedirect on page load", async () => {
        await page.goto(SAMPLE_HOME_URL);
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
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).to.be.eq(5);
    });

    it("Performs loginRedirect on page load from a page other than redirectUri", async () => {
        await page.goto(SAMPLE_HOME_URL + "?testPage");
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
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(await BrowserCache.getAccountFromCache(tokenStore.idTokens[0])).to.not.be.null;
        expect(await BrowserCache.accessTokenForScopesExists(tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;
        const storage = await BrowserCache.getWindowStorage();
        expect(Object.keys(storage).length).to.be.eq(5);
    });
});
