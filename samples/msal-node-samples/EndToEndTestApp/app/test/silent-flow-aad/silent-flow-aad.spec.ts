import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from '../../../../../e2eTestUtils/LabApiQueryParams';
import { AppTypes, AzureEnvironments } from '../../../../../e2eTestUtils/Constants';

const SCREENSHOT_BASE_FOLDER_NAME = `${__dirname}/screenshots`;
const SAMPLE_HOME_URL = 'http://localhost:3000/';
const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;

let username: string;
let accountPwd: string;

async function enterCredentials(page: puppeteer.Page, screenshot: Screenshot): Promise<void> {
    await page.waitForNavigation({ waitUntil: "networkidle0"});
    await page.waitForSelector("#i0116");
    await screenshot.takeScreenshot(page, `loginPage`);
    await page.type("#i0116", username);
    await page.click("#idSIButton9");
    await page.waitForSelector("#idA_PWD_ForgotPassword");
    await screenshot.takeScreenshot(page, `pwdInputPage`);
    await page.type("#i0118", accountPwd);
    await page.click("#idSIButton9");
}

describe('Silent Flow', () => {
    jest.setTimeout(60000);
    let browser: puppeteer.Browser;
    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD
        }

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '-disable-setuid-sandbox', '--disable-extensions']
        });
    })

    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    beforeEach(async () => {
        context = await browser.createIncognitoBrowserContext();
        page = await context.newPage();
        // Configure the navigation timeout
        await page.setDefaultNavigationTimeout(0);
        await page.goto(SAMPLE_HOME_URL);
    });

    afterEach(async () => {
        await page.close();
        NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
    });

    afterAll(async () => {
        await context.close();
        await browser.close();
    });

    it("Performs acquire token", async ()=> {
        const cacheBeforeAuth = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
        const testName = "silent-flow-aad-acquireToken";
        const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
        await screenshot.takeScreenshot(page, "samplePageInit");
        await page.click("#SignIn");
        await enterCredentials(page, screenshot);
        await page.waitForNavigation({ waitUntil: "networkidle0"});
        await screenshot.takeScreenshot(page, "rememberPage");
        const cacheAfterAuth = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
        expect(cacheBeforeAuth.accessTokens.length).toBe(0);
        expect(cacheBeforeAuth.idTokens.length).toBe(0);
        expect(cacheBeforeAuth.refreshTokens.length).toBe(0);
        expect(cacheAfterAuth.accessTokens.length).toBe(1);
        expect(cacheAfterAuth.idTokens.length).toBe(1);
        expect(cacheAfterAuth.refreshTokens.length).toBe(1);
    });
});