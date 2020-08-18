import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import { Screenshot, createFolder, setupCredentials, getTokens, getAccountFromCache, accessTokenForScopesExists } from "../../../e2eTests/TestUtils"

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
        await page.goto(SAMPLE_HOME_URL);
    });

    afterEach(async () => {
        await page.close();
    });

    after(async () => {
        await context.close();
        await browser.close();
    });

    // TODO: Add tests
});
