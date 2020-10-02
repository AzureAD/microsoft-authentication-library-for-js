import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, } from "../../../../e2eTestUtils/TestUtils";
import { getTokens } from "../../../../e2eTestUtils/NodeCacheTestUtils";

const SAMPLE_HOME_URL = 'http://localhost:3000/';
const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;

let username = ""; // TODO:
let accountPwd = ""; // TODO:

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

describe('Silent Flow', () => {
    let browser: puppeteer.Browser;
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: false,
            ignoreDefaultArgs: ['--no-sandbox', '-disable-setuid-sandbox', '--disable-extensions']
        });
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
    })

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

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs acquire token", async ()=> {
        jest.setTimeout(30000);
        
        const testName = "silent-flow-aad-acquireToken";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await page.click("#SignIn");
        await enterCredentials(page, screenshot);
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        const jsonCache = require('../../data/testCache.json');
        let tokenStore = await getTokens();
        console.log(tokenStore);
        // expect(tokenStore.idTokens).toHaveLength(1);
        // expect(tokenStore.accessTokens).toHaveLength(1);
        // expect(tokenStore.refreshTokens).toHaveLength(1);
        // expect(getAccountFromCache(page, tokenStore.idTokens[0])).not.toBeNull();
        // expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).toBe(true);
        // const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        expect(Object.keys(tokenStore).length).toBe(4);
    });
});