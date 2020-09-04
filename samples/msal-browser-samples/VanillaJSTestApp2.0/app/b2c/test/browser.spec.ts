import * as Mocha from "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { createFolder, setupCredentials, Screenshot, getTokens, getAccountFromCache, accessTokenForScopesExists, removeTokens } from "../../../e2eTests/TestUtils";

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

    // Keep me signed in dialog box
    await page.waitForSelector("#idSIButton9");
    await page.click("#idSIButton9");
}

async function loginRedirect(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
    // Home Page
    await screenshot.takeScreenshot(page, `samplePageInit`);
    // Click Sign In
    await page.click("#SignIn");
    await screenshot.takeScreenshot(page, `signInClicked`);
    // Click Sign In With Redirect
    await page.click("#loginRedirect");
    await page.waitForSelector("#MSIDLAB4_AzureAD");
    await screenshot.takeScreenshot(page, "b2cSignInPage");
    // Select Lab Provider
    await page.click("#MSIDLAB4_AzureAD");

    // Enter credentials
    await enterCredentials(page, screenshot);
    // Wait for return to page
    await page.waitForSelector("#getAccessTokenRedirect");
    await page.waitFor(50);
    await screenshot.takeScreenshot(page, `samplePageLoggedIn`);
}

async function loginPopup(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
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

    await popupPage.waitForSelector("#MSIDLAB4_AzureAD");
    await screenshot.takeScreenshot(popupPage, "b2cSignInPage");
    // Select Lab Provider
    await popupPage.click("#MSIDLAB4_AzureAD");

    // Enter credentials
    await enterCredentials(popupPage, screenshot);
    // Wait until popup window closes and see that we are logged in
    await popupWindowClosed;
    await page.waitForSelector("#getAccessTokenPopup");
    await page.waitFor(50);
    await screenshot.takeScreenshot(page, `samplePageLoggedIn`);
}

describe("Browser tests", function () {
    this.timeout(8000);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        [username, accountPwd] = await setupCredentials("azurecloud");
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '–disable-setuid-sandbox']
        });
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    after(async () => {
        await context.close();
        await browser.close();
    });

    describe("Test Login functions", async () => {  
        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto('http://localhost:30662/');
        });
    
        afterEach(async () => {
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await loginRedirect(page, screenshot);
            
            const tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        });
        
        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await loginPopup(page, screenshot);
            
            const tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
        });
    });

    describe("Test AcquireToken functions", async () => {
        const testName = "acquireTokenBaseCase";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

        before(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto('http://localhost:30662/');
            await loginPopup(page, screenshot);
        });
    
        after(async () => {
            await page.close();
        });

        afterEach(async () => {
            const tokenStore = await getTokens(page);
            await removeTokens(page, tokenStore.accessTokens);
            await removeTokens(page, tokenStore.refreshTokens);
            await page.reload();
        });

        it("Test acquireTokenRedirect", async () => {
            await page.click("#getAccessTokenRedirect");
            await page.waitForSelector("#access-token-info");
            await screenshot.takeScreenshot(page, "accessTokenAcquiredRedirect");

            const tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(tokenStore.accessTokens).to.be.length(1);
            expect(tokenStore.refreshTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
            expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).to.be.true;
        }); 

        it("Test acquireTokenPopup", async () => {
            await page.click("#getAccessTokenPopup");
            await page.waitForSelector("#access-token-info");
            await screenshot.takeScreenshot(page, "accessTokenAcquiredPopup");

            const tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(tokenStore.accessTokens).to.be.length(1);
            expect(tokenStore.refreshTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
            expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).to.be.true;
        }); 

        it("Test acquireTokenSilent", async () => {
            // AcquireTokenSilent no refresh token available
            await page.waitForSelector("#getAccessTokenSilent");
            await page.click("#getAccessTokenSilent");
            await page.waitForSelector("#access-token-info");
            await screenshot.takeScreenshot(page, "accessTokenAcquiredSilently");

            let tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(tokenStore.accessTokens).to.be.length(1);
            expect(tokenStore.refreshTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
            expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).to.be.true;

            // AcquireTokenSilent use refresh token to acquire new accessToken
            await removeTokens(page, tokenStore.accessTokens);
            await page.reload();
            await page.waitForSelector("#getAccessTokenSilent");
            await page.click("#getAccessTokenSilent");
            await page.waitForSelector("#access-token-info");
            await screenshot.takeScreenshot(page, "accessTokenAcquiredSilently");

            tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(tokenStore.accessTokens).to.be.length(1);
            expect(tokenStore.refreshTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
            expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).to.be.true;

            // AcquireTokenSilent from cache
            await page.reload();
            await page.waitForSelector("#getAccessTokenSilent");
            await page.click("#getAccessTokenSilent");
            await page.waitForSelector("#access-token-info");
            await screenshot.takeScreenshot(page, "accessTokenAcquiredSilently");

            tokenStore = await getTokens(page);
            expect(tokenStore.idTokens).to.be.length(1);
            expect(tokenStore.accessTokens).to.be.length(1);
            expect(tokenStore.refreshTokens).to.be.length(1);
            expect(getAccountFromCache(page, tokenStore.idTokens[0])).to.not.be.null;
            expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"])).to.be.true;
        }); 
    });
});