import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, getTokens, getAccountFromCache, accessTokenForScopesExists } from "../../../e2eTests/TestUtils"

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let username = "";
let accountPwd = "";

async function enterCredentials(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage`);
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0118");
    await screenshot.takeScreenshot(page, `pwdInputPage`);
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
}

describe("Browser tests", function () {
    this.timeout(0);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        [username, accountPwd] = await setupCredentials("azureppe");
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

    it("Performs loginRedirect", async () => {
        const testName = "redirectBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        // Home Page
        await screenshot.takeScreenshot(page, `samplePageInit`);
        // Click Sign In
        await page.click("#SignIn");
        await screenshot.takeScreenshot(page, `signInClicked`);
        // Click Sign In With Redirect
        await page.click("#loginRedirect");
        // Enter credentials
        await enterCredentials(page, screenshot);
        // Wait for return to page
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        await screenshot.takeScreenshot(page, `samplePageLoggedIn`);
        let tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;
    });

    it("Performs loginPopup", async () => {
        const testName = "popupBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        // Home Page
        await screenshot.takeScreenshot(page, `samplePageInit`);
        // Click Sign In
        await page.click("#SignIn");
        await screenshot.takeScreenshot(page, `signInClicked`);
        // Click Sign In With Popup
        const newPopupWindowPromise = new Promise<puppeteer.Page>(resolve => page.once('popup', resolve));
        await page.click("#loginPopup");
        const popupPage = await newPopupWindowPromise;
        const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));
        // Enter credentials
        await enterCredentials(popupPage, screenshot);
        // Wait until popup window closes and see that we are logged in
        await popupWindowClosed;
        // Wait for token acquisition
        await page.waitFor(2000);
        expect(popupPage.isClosed()).to.be.true;
        await screenshot.takeScreenshot(page, `samplePageLoggedIn`);
        let tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;
    });
});
