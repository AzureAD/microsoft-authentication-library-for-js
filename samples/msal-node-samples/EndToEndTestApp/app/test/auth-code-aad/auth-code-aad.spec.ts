import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments } from "../../../../../e2eTestUtils/Constants";
import { 
    enterCredentials, 
    SCREENSHOT_BASE_FOLDER_NAME,
    enterCredentialsWithConsent,
 } from "../testUtils";

const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;
const SUCCESSFUL_SIGNED_IN_MESSAGE = "OK";
const HOME_ROUTE="http://localhost:3000";

let username: string;
let accountPwd: string;

describe('Auth Code AAD PPE Tests', () => {
    jest.setTimeout(60000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    
    beforeAll(async() => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        browser = await puppeteer.launch({
            headless: true,
            ignoreDefaultArgs: ['--no-sandbox', '-disable-setuid-sandbox', '--disable-extensions']
        });
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let testName: string;
        let screenshot: Screenshot;
        let environment = 'aad';

        beforeAll(() => {
            testName = "authCodeAcquireToken";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}/${environment}`);
        });

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.on('dialog', async dialog => {
                console.log(dialog.message());
                await dialog.dismiss();
            });
            page.setDefaultNavigationTimeout(0);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            await page.goto(HOME_ROUTE);
            await enterCredentials(page, screenshot, username, accountPwd);
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            const cachedTokens = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
         });

        it("Performs acquire token with prompt = 'login'", async () => {
            await page.goto(`${HOME_ROUTE}/?prompt=login`);
            await enterCredentials(page, screenshot, username, accountPwd);
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            const cachedTokens = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'consent'", async () => {
            await page.goto(`${HOME_ROUTE}/?prompt=consent`);
            await enterCredentialsWithConsent(page, screenshot, username, accountPwd);
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            const cachedTokens = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'none'", async () => {
            // First log the user in first
            await page.goto(`${HOME_ROUTE}/?prompt=login`);
            await enterCredentials(page, screenshot, username, accountPwd);
            let htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            
            // Reset the cache to prepare for the second login
            NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);

            // Login without a prompt 
            await page.goto(`${HOME_ROUTE}/?prompt=none`);
            await new Promise(resolve => { setTimeout(() => { resolve(true) }, 4000)})
            htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            const cachedTokens = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with state", async () => {
            const STATE_VALUE = "value_on_state";
            await page.goto(`${HOME_ROUTE}/?prompt=login&state=${STATE_VALUE}`);
            await enterCredentials(page, screenshot, username, accountPwd);
            await new Promise(resolve => { setTimeout(() => { resolve(true) }, 4000)});
            const url = await page.url();
            expect(url.includes(`state=${STATE_VALUE}`)).toBe(true);
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_SIGNED_IN_MESSAGE);
            const cachedTokens = NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with login hint", async () => {
            const USERNAME = "test@domain.abc";
            await page.goto(`${HOME_ROUTE}/?prompt=login&loginHint=${USERNAME}`);
            await page.waitForSelector("#i0116");
            const emailInput = await page.$("#i0116")
            const email = await page.evaluate(element => element.value, emailInput);
            expect(email).toBe(USERNAME);
        });
    });
});