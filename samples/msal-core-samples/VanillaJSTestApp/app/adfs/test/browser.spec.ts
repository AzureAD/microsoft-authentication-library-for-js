import path from "path"
import puppeteer from "puppeteer";
import { expect } from "chai";
import fs from "fs";
import { LabClient, ILabApiParams } from "../../../e2eTests/LabClient";
import { StringReplacer } from "../../../../../e2eTestUtils/ConfigUtils";

const stringReplacer = new StringReplacer(path.join(__dirname, "../authConfig.js"));

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let SCREENSHOT_NUM = 0;
let username = "";
let accountPwd = "";
let idTokenCacheKey: string;
let clientInfoCacheKey: string;
let clientId: string;

let authority = "https://fs.msidlab8.com/adfs/";
let domain = "fs.msidlab8.com";

function setupScreenshotDir() {
    if (!fs.existsSync(`${SCREENSHOT_BASE_FOLDER_NAME}`)) {
        fs.mkdirSync(SCREENSHOT_BASE_FOLDER_NAME);
    }
}

async function setupCredentials() {
    const testCreds = new LabClient();
    const userParams: ILabApiParams = {
        envName: "onprem",
        userType: "onprem",
        federationProvider: "adfsv2019"
    };
    const envResponse = await testCreds.getUserVarsByCloudEnvironment(userParams);
    const testEnv = envResponse[0];
    if (testEnv.upn) {
        username = testEnv.upn;
    }
    if (testEnv.appId) {
        clientId = testEnv.appId;
        idTokenCacheKey = "msal." + clientId + ".idtoken"
        clientInfoCacheKey = "msal." + clientId + ".client.info"
    }

    const testPwdSecret = await testCreds.getSecret(testEnv.labName);

    accountPwd = testPwdSecret.value;
}

async function takeScreenshot(page: puppeteer.Page, testName: string, screenshotName: string): Promise<void> {
    const screenshotFolderName = `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    if (!fs.existsSync(`${screenshotFolderName}`)) {
        fs.mkdirSync(screenshotFolderName);
    }
    await page.screenshot({ path: `${screenshotFolderName}/${++SCREENSHOT_NUM}_${screenshotName}.png` });
}

async function enterCredentials(page: puppeteer.Page, testName: string): Promise<void> {
    await takeScreenshot(page, testName, "SignInPage");
    await page.type("#userNameInput", username);
    await page.type("#passwordInput", accountPwd);
    await page.click("#submitButton");
}

async function loginRedirect(page: puppeteer.Page, testName: string): Promise<void> {
    // Home Page
    await takeScreenshot(page, testName, `samplePageInit`);
    // Click Sign In
    await page.click("#SignIn");
    await takeScreenshot(page, testName, `signInClicked`);
    // Click Sign In With Redirect
    await page.click("#loginRedirect");
    await page.waitForSelector("#loginArea");
    // Enter credentials
    await enterCredentials(page, testName);
    // Wait for return to page
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#getAccessTokenRedirect");
    await takeScreenshot(page, testName, `samplePageLoggedIn`);
}

async function loginPopup(page: puppeteer.Page, testName: string): Promise<void> {
    // Home Page
    await takeScreenshot(page, testName, `samplePageInit`);
    // Click Sign In
    await page.click("#SignIn");
    await takeScreenshot(page, testName, `signInClicked`);
    // Click Sign In With Popup
    const newPopupWindowPromise = new Promise<puppeteer.Page>(resolve => page.once('popup', resolve));
    await page.click("#loginPopup");
    const popupPage = await newPopupWindowPromise;
    const popupWindowClosed = new Promise<void>(resolve => popupPage.once("close", resolve));
    await popupPage.waitForSelector("#loginArea");

    // Enter credentials
    await enterCredentials(popupPage, testName);
    // Wait until popup window closes and see that we are logged in
    await popupWindowClosed;
    await page.waitForSelector("#getAccessTokenPopup");
    await takeScreenshot(page, testName, `samplePageLoggedIn`);
}

async function validateAccessTokens(page: puppeteer.Page, localStorage: Storage) {
    let accessTokensFound = 0
    let accessTokenMatch: boolean;

    Object.keys(localStorage).forEach(async (key) => {
        if (key.includes("authority")) {
            let cacheKey = JSON.parse(key);
            // let cachedScopeList = cacheKey.scopes.split(" ");

            accessTokenMatch = cacheKey.authority === authority.toLowerCase() &&
                                cacheKey.clientId.toLowerCase() === clientId.toLowerCase()
                                // scopes.every(scope => cachedScopeList.includes(scope));

            if (accessTokenMatch) {
                accessTokensFound += 1;
                await page.evaluate((key) => window.localStorage.removeItem(key))
            }
        }
    });

    return accessTokensFound;
}

describe("Browser tests", function () {
    this.timeout(30000);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        setupScreenshotDir();
        await setupCredentials();

        stringReplacer.replace({
            "ENTER_CLIENT_ID_HERE": clientId,
            "ENTER_ADFS_AUTHORITY_HERE": authority,
            "ENTER_ADFS_DOMAIN_HERE": domain,
        });

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
        stringReplacer.restore();
    });

    describe("Test Login functions", async () => {
        beforeEach(async () => {
            SCREENSHOT_NUM = 0;
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto('http://localhost:30662/');
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
            await page.goto('http://localhost:30662/');
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
            expect(accessTokensFound).to.equal(1);
        });

        it("Test acquireTokenPopup", async () => {
            await page.click("#getAccessTokenPopup");
            await page.waitForSelector("#access-token-info");
            await takeScreenshot(page, testName, "accessTokenAcquiredPopup");

            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);

            const accessTokensFound = await validateAccessTokens(page, localStorage);
            expect(accessTokensFound).to.equal(1);
        });

        it("Test acquireTokenSilent", async () => {
            await page.click("#getAccessTokenSilent");
            await page.waitForSelector("#access-token-info");
            await takeScreenshot(page, testName, "accessTokenAcquiredSilently");

            const localStorage = await page.evaluate(() =>  Object.assign({}, window.localStorage));
            expect(Object.keys(localStorage)).to.contain(idTokenCacheKey);
            expect(Object.keys(localStorage)).to.contain(clientInfoCacheKey);

            const accessTokensFound = await validateAccessTokens(page, localStorage);
            expect(accessTokensFound).to.equal(1);
        });
    });
});
