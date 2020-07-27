import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { ILabApiParams } from "../../../e2eTests/LabClient";
import { Screenshot, createFolder, setupCredentials, getTokens, removeTokens, getAccountFromCache, accessTokenForScopesExists } from "../../../e2eTests/TestUtils"

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let username = "";
let accountPwd = "";

async function enterCredentials(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, "loginPage");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0118");
    await screenshot.takeScreenshot(page, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
}

describe("Browser tests", function () {
    this.timeout(0);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        const userParams: ILabApiParams = {envName: "azureppe"};
        [username, accountPwd] = await setupCredentials(userParams);
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '–disable-setuid-sandbox']
        });
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        await page.goto('http://localhost:30662/');
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
        await enterCredentials(page, screenshot);
        // Wait for return to page
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        await screenshot.takeScreenshot(page, "samplePageLoggedIn");
        let tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;

        // acquire First Access Token
        await removeTokens(page, tokenStore.accessTokens);
        await page.click("#seeProfile");
        await page.waitFor(2000)
        await screenshot.takeScreenshot(page, "seeProfile");
        tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;

        //acquire Second Access Token
        await page.click("#secondToken");
        await page.waitForSelector("#second-resource-div");
        await screenshot.takeScreenshot(page, "secondToken");
        tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(2);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["https://msidlab0.spoppe.com/User.Read"])).to.be.true;
    });
});
