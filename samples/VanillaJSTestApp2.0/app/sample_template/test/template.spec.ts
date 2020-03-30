import "mocha";
import puppeteer from "puppeteer";
import { expect } from "chai";
import fs from "fs";

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
let SCREENSHOT_NUM = 0;

function setupScreenshotDir() {
    if (!fs.existsSync(`${SCREENSHOT_BASE_FOLDER_NAME}`)) {
        fs.mkdirSync(SCREENSHOT_BASE_FOLDER_NAME);
    }
}

async function takeScreenshot(page: puppeteer.Page, testName: string, screenshotName: string): Promise<void> {
    const screenshotFolderName = `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    if (!fs.existsSync(`${screenshotFolderName}`)) {
        fs.mkdirSync(screenshotFolderName);
    }
    await page.screenshot({ path: `${screenshotFolderName}/${++SCREENSHOT_NUM}_${screenshotName}.png` });
}

async function enterCredentials(page: puppeteer.Page, testName: string): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await takeScreenshot(page, testName, `loginPage`);
    await page.type("#i0116", "IDLAB@msidlab0.ccsctp.net");
    await page.click("#idSIButton9");
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await takeScreenshot(page, testName, `pwdInputPage`);
    await page.type("#i0118", "");
    await page.click("#idSIButton9");
}

describe("Browser tests", function () {
    this.timeout(8000);
    this.retries(1);

    let browser: puppeteer.Browser;
    before(async () => {
        setupScreenshotDir();
        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '–disable-setuid-sandbox']
        });
    });

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    beforeEach(async () => {
        SCREENSHOT_NUM = 0;
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

    // TODO: Add browser tests for sample here
});
