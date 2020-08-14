import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, getTokens, getAccountFromCache, accessTokenForScopesExists } from "../../../../../e2eTestUtils/TestUtils";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AzureEnvironments, AppTypes } from "../../../../../e2eTestUtils/Constants";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const SAMPLE_HOME_URL = 'http://localhost:30662/';
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

async function goBackToSampleHomepage(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage`);
    await page.click("#idBtn_Back");
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage2`);
    await page.click("#idBtn_Back");
}

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
        await page.goto(SAMPLE_HOME_URL);
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
        const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        expect(Object.keys(storage).length).to.be.eq(4);
    });

    it("Hitting browser back button in redirect clears cache", async () => {
        const testName = "redirectBrowserBackButton";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        // Home Page
        await screenshot.takeScreenshot(page, `samplePageInit`);
        // Click Sign In
        await page.click("#SignIn");
        await screenshot.takeScreenshot(page, `signInClicked`);
        // Click Sign In With Redirect
        await page.click("#loginRedirect");
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        // Click back button
        await page.goBack();
        const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        expect(Object.keys(storage).length).to.be.eq(0);
    });

    it("Hitting dialog back button in redirect clears cache", async () => {
        const testName = "redirectDialogBackButton";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        // Home Page
        await screenshot.takeScreenshot(page, `samplePageInit`);
        // Click Sign In
        await page.click("#SignIn");
        await screenshot.takeScreenshot(page, `signInClicked`);
        // Click Sign In With Redirect
        await page.click("#loginRedirect");
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        await goBackToSampleHomepage(page, screenshot);
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        // Server returns error in the hash, so length = 1 for server telemetry
        expect(Object.keys(storage).length).to.be.eq(1);
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
        await page.waitFor(1000);
        expect(popupPage.isClosed()).to.be.true;
        await screenshot.takeScreenshot(page, `samplePageLoggedIn`);
        let tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).to.be.length(1);
        expect(tokenStore.accessTokens).to.be.length(1);
        expect(tokenStore.refreshTokens).to.be.length(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).to.be.true;
        const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        expect(Object.keys(storage).length).to.be.eq(4);
    });

    it("Closing popup before login resolves clears cache", async () => {
        const testName = "popupCloseWindow";
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
        await screenshot.takeScreenshot(popupPage, `popupOpened`)
        await popupPage.close();
        // Wait for processing
        await page.waitFor(500);
        // Wait until popup window closes
        const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        expect(Object.keys(storage).length).to.be.eq(1);
    });
});
