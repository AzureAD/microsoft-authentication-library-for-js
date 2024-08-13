import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    RETRY_TIMES,
    enterCredentialsADFS,
    enterCredentialsADFSWithConsent,
    SCREENSHOT_BASE_FOLDER_NAME,
    SAMPLE_HOME_URL,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    AppTypes,
    AzureEnvironments,
    FederationProviders,
    UserTypes,
} from "e2e-test-utils";
import { PublicClientApplication } from "@azure/msal-node";

const TEST_CACHE_LOCATION = `${__dirname}/data/adfs.cache.json`;

const getTokenAuthCode = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

const config = require("../config/ADFS.json");

let username: string;
let accountPwd: string;

describe("Auth Code ADFS 2019 Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;
    const screenshotFolder = `${SCREENSHOT_BASE_FOLDER_NAME}/auth-code/adfs`;

    beforeAll(async () => {
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = 3001;
        homeRoute = `http://localhost:${port}`;
        createFolder(screenshotFolder);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
            federationProvider: FederationProviders.ADFS2019,
            userType: UserTypes.FEDERATED,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParms
        );
        [username, accountPwd] = await setupCredentials(
            envResponse[0],
            labClient
        );
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let publicClientApplication: PublicClientApplication;
        let server: any;

        beforeAll(async () => {
            publicClientApplication = new PublicClientApplication({
                auth: config.authOptions,
                cache: { cachePlugin },
            });
            server = getTokenAuthCode(config, publicClientApplication, port);
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterAll(async () => {
            if (server) {
                server.close();
            }
        });

        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(5000);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/BaseCase`);
            await page.goto(homeRoute);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                2000
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'login'", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/PromptLogin`
            );
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                2000
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'consent'", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/PromptConsent`
            );
            await page.goto(`${homeRoute}/?prompt=consent`);
            await enterCredentialsADFSWithConsent(
                page,
                screenshot,
                username,
                accountPwd
            );
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                2000
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'none'", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/PromptNone`);
            // First login
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );

            // Reset the cache
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);

            await page.goto(`${homeRoute}/?prompt=none`, {
                waitUntil: "networkidle0",
            });
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                2000
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with state", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/WithState`);
            const STATE_VALUE = "value_on_state";
            await page.goto(`${homeRoute}/?prompt=login&state=${STATE_VALUE}`);
            await enterCredentialsADFS(page, screenshot, username, accountPwd);
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            const url = page.url();
            expect(url.includes(`state=${STATE_VALUE}`)).toBe(true);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                2000
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with login hint", async () => {
            const USERNAME = "test@domain.abc";
            await page.goto(
                `${homeRoute}/?prompt=login&loginHint=${USERNAME}`,
                { waitUntil: "networkidle0" }
            );
            await page.waitForSelector("#i0116");
            const emailInput = await page.$("#i0116");
            const email = await page.evaluate((element) => {
                const emailInput = element as HTMLInputElement;
                return emailInput.value;
            }, emailInput);
            expect(email).toBe(USERNAME);
        });

        // NOTE: This test runs successfully only when we are running in headless mode
        it.skip("Performs acquire token with domain hint", async () => {
            const DOMAIN = "microsoft.com";
            const MS_LOGIN_URL = "msft.sts.microsoft.com";
            await page.goto(`${homeRoute}/?domainHint=${DOMAIN}`);
            await page.waitForNavigation({ waitUntil: "networkidle2" });
            const url = await page.url();
            console.log(url);
            expect(url.includes(MS_LOGIN_URL)).toBe(true);
        });
    });
});
