import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments, FederationProviders, UserTypes } from "../../../../e2eTestUtils/Constants";
import { 
    enterCredentialsADFS, 
    enterCredentialsADFSWithConsent, 
    SCREENSHOT_BASE_FOLDER_NAME,
 } from "../../testUtils";
import { Configuration, PublicClientApplication } from "../../../../../lib/msal-node/";

const TEST_CACHE_LOCATION = `${__dirname}/data/testCache.json`;
const HOME_ROUTE="http://localhost:3000";

const getTokenAuthCode = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

const config = require("../config/ADFS.json");

let username: string;
let accountPwd: string;

describe('Auth Code ADFS PPE Tests', () => {
    jest.setTimeout(15000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;
    
    beforeAll(async() => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = global.__PORT__;
        homeRoute = `http://localhost:${port}`;
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            federationProvider: FederationProviders.ADFS2019,
            userType: UserTypes.FEDERATED
        }; 

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let testName: string;
        let screenshot: Screenshot;
        let environment = 'adfs';
        let publicClientApplication: PublicClientApplication;
        let clientConfig: Configuration;

        beforeAll(async () => {
            testName = "authCodeAcquireToken";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}/${environment}`);
            publicClientApplication = new PublicClientApplication(clientConfig);
            getTokenAuthCode(config, publicClientApplication);
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultNavigationTimeout(0);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            await page.goto(HOME_ROUTE);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });
         
        it("Performs acquire token with prompt = 'login'", async () => {
            await page.goto(`${HOME_ROUTE}/?prompt=login`);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });
        
        it("Performs acquire token with prompt = 'consent'", async () => {
            await page.goto(`${HOME_ROUTE}/?prompt=consent`);
            await enterCredentialsADFSWithConsent(page, screenshot, username, accountPwd);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'none'", async () => {
            // First login
            await page.goto(`${HOME_ROUTE}/?prompt=login`);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);

            // Reset the cache
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);

            await page.goto(`${HOME_ROUTE}/?prompt=none`);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with state", async () => {
            const STATE_VALUE = "value_on_state";
            await page.goto(`${HOME_ROUTE}/?prompt=login&state=${STATE_VALUE}`);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            const url = page.url();
            expect(url.includes(`state=${STATE_VALUE}`)).toBe(true);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
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

        // NOTE: This test runs successfully only when we are running in headless mode
        it.skip("Performs acquire token with domain hint", async () => {
            const DOMAIN = "microsoft.com";
            const MS_LOGIN_URL = "msft.sts.microsoft.com";
            await page.goto(`${HOME_ROUTE}/?domainHint=${DOMAIN}`);
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            const url = await page.url();
            console.log(url);
            expect(url.includes(MS_LOGIN_URL)).toBe(true);
        });
    });
});