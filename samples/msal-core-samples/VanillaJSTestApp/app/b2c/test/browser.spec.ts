import * as Mocha from "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import fs from "fs";
import { LabClient, ILabApiParams } from "../../../e2eTests/LabClient";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let SCREENSHOT_NUM = 0;
let username = "";
let accountPwd = "";

// Set App Info
const clientId = "e3b9ad76-9763-4827-b088-80c7a7888f79";
const authority = "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy/";
const scopes = ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"];
const idTokenCacheKey = "msal." + clientId + ".idtoken";
const clientInfoCacheKey = "msal." + clientId + ".client.info";

function setupScreenshotDir() {
    if (!fs.existsSync(`${SCREENSHOT_BASE_FOLDER_NAME}`)) {
        fs.mkdirSync(SCREENSHOT_BASE_FOLDER_NAME);
    }
}

async function setupCredentials() {
    const testCreds = new LabClient();
    const userParams: ILabApiParams = {envName: "azurecloud"};
    const envResponse = await testCreds.getUserVarsByCloudEnvironment(userParams);
    const testEnv = envResponse[0];
    if (testEnv.upn) {
        username = testEnv.upn;
    }

    const testPwdSecret = await testCreds.getSecret(testEnv.labName);

    accountPwd = testPwdSecret.value;
}

async function takeScreenshot(page: puppeteer.Page, testName: string, screenshotName: string): Promise<void> {
    const screenshotFolderName = `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`;
    if (!fs.existsSync(`${screenshotFolderName}`)) {
        fs.mkdirSync(screenshotFolderName);
    }
    await page.screenshot({ path: `${screenshotFolderName}/${++SCREENSHOT_NUM}_${screenshotName}.png` });
}

async function enterCredentials(page: puppeteer.Page, testName: string): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await takeScreenshot(page, testName, "loginPage");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await takeScreenshot(page, testName, "pwdInputPage");
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");

    // Keep me signed in dialog box
    await page.waitForSelector("#idSIButton9");
    await page.click("#idSIButton9");
}

async function loginRedirect(page: puppeteer.Page, testName: string): Promise<void> {
    // Home Page
    await takeScreenshot(page, testName, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await takeScreenshot(page, testName, "signInClicked");
    // Click Sign In With Redirect
    await page.click("#loginRedirect");
    await page.waitForSelector("#MSIDLAB4_AzureAD");
    await takeScreenshot(page, testName, "b2cSignInPage");
    // Select Lab Provider
    await page.click("#MSIDLAB4_AzureAD");

    // Enter credentials
    await enterCredentials(page, testName);
    // Wait for return to page
    await page.waitForSelector("#getAccessTokenRedirect");
    await takeScreenshot(page, testName, "samplePageLoggedIn");
}

async function loginPopup(page: puppeteer.Page, testName: string): Promise<void> {
    // Home Page
    await takeScreenshot(page, testName, "samplePageInit");
    // Click Sign In
    await page.click("#SignIn");
    await takeScreenshot(page, testName, "signInClicked");
    // Click Sign In With Popup
    const newPopupWindowPromise = new Promise<puppeteer.Page>(resolve => page.once("popup", resolve));
    await page.click("#loginPopup");
    const popupPage = await newPopupWindowPromise;
    const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));

    await popupPage.waitForSelector("#MSIDLAB4_AzureAD");
    await takeScreenshot(popupPage, testName, "b2cSignInPage");
    // Select Lab Provider
    await popupPage.click("#MSIDLAB4_AzureAD");

    // Enter credentials
    await enterCredentials(popupPage, testName);
    // Wait until popup window closes and see that we are logged in
    await popupWindowClosed;
    await page.waitForSelector("#getAccessTokenPopup");
    await takeScreenshot(page, testName, "samplePageLoggedIn");
}

async function validateAccessTokens(page: puppeteer.Page, localStorage: Storage) {
    let accessTokensFound = 0;
    let accessTokenMatch: boolean;

    Object.keys(localStorage).forEach(async (key) => {
        if (key.includes("authority")) {
            const cacheKey = JSON.parse(key);
            // let cachedScopeList = cacheKey.scopes.split(" ");

            accessTokenMatch = cacheKey.authority === authority.toLowerCase() &&
                                cacheKey.clientId.toLowerCase() === clientId.toLowerCase();
            // scopes.every(scope => cachedScopeList.includes(scope));

            if (accessTokenMatch) {
                accessTokensFound += 1;
                await page.evaluate((key) => window.localStorage.removeItem(key));
            }
        }
    });

    return accessTokensFound;
}

describe("Browser tests", function () {
    this.timeout(15000);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        setupScreenshotDir();
        setupCredentials();
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ["--no-sandbox", "–disable-setuid-sandbox"]
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
            SCREENSHOT_NUM = 0;
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto("http://localhost:30662/");
        });
    
        afterEach(async () => {
            await page.close();
        });

        it("Performs loginRedirect", async () => {
            const testName = "redirectBaseCase";
            await loginRedirect(page, testName);
            
            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));

            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);
        });
        
        it("Performs loginPopup", async () => {
            const testName = "popupBaseCase";
            await loginPopup(page, testName);
            
            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);
        });
    });

    describe("Test AcquireToken functions", async () => {
        const testName = "acquireTokenBaseCase";

        before(async () => {
            SCREENSHOT_NUM = 0;
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto("http://localhost:30662/");
            await loginPopup(page, testName);
        });
    
        after(async () => {
            await page.close();
        });

        afterEach(async () => {
            await page.reload();
        });

        it("Test acquireTokenRedirect", async () => {
            await page.click("#getAccessTokenRedirect");
            await page.waitForSelector("#access-token-info");
            await takeScreenshot(page, testName, "accessTokenAcquiredRedirect");

            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);

            const accessTokensFound = await validateAccessTokens(page, localStorage);
            expect(accessTokensFound).to.equal(2);
        }); 

        it("Test acquireTokenPopup", async () => {
            await page.click("#getAccessTokenPopup");
            await page.waitForSelector("#access-token-info");
            await takeScreenshot(page, testName, "accessTokenAcquiredPopup");

            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);

            const accessTokensFound = await validateAccessTokens(page, localStorage);
            expect(accessTokensFound).to.equal(2);
        }); 

        it("Test acquireTokenSilent", async () => {
            await page.click("#getAccessTokenSilent");
            await page.waitForSelector("#access-token-info");
            await takeScreenshot(page, testName, "accessTokenAcquiredSilently");

            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);
            
            const accessTokensFound = await validateAccessTokens(page, localStorage);
            expect(accessTokensFound).to.equal(2);
        }); 
    });
});
