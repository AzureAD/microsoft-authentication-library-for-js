import "jest";
import puppeteer from "puppeteer";
import {  getTokens, getAccountFromCache, accessTokenForScopesExists } from "../../../e2eTests/TestUtils"

const SAMPLE_HOME_URL = 'http://localhost:3000/';

let username = ""; // TODO:
let accountPwd = ""; // TODO:

async function enterCredentials(page: puppeteer.Page): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0118");
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
}

describe('Silent Flow', () => {
    let browser: puppeteer.Browser;
    beforeAll(async () => {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandobox', '-disable-setuid-sandbox']
        });
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

    it("Performs loginRedirect", async ()=> {
        jest.setTimeout(30000);
        await page.click("#SignIn");
        await enterCredentials(page);
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        let tokenStore = await getTokens(page);
        expect(tokenStore.idTokens).toHaveLength(1);
        expect(tokenStore.accessTokens).toHaveLength(1);
        expect(tokenStore.refreshTokens).toHaveLength(1);
        expect(getAccountFromCache(page, tokenStore.idTokens[0])).not.toBeNull();
        expect(await accessTokenForScopesExists(page, tokenStore.accessTokens, ["openid", "profile", "user.read"])).toBe(true);
        const storage = await page.evaluate(() =>  Object.assign({}, window.sessionStorage));
        expect(Object.keys(storage).length).to.Be(4);
    });
});