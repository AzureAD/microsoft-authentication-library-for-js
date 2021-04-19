/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import "jest";
import puppeteer from "puppeteer";
import { Screenshot, createFolder, setupCredentials } from "../../../e2eTestUtils/TestUtils";
import { NodeCacheTestUtils } from "../../../e2eTestUtils/NodeCacheTestUtils";
import { LabClient } from "../../../e2eTestUtils/LabClient";
import { LabApiQueryParams } from "../../../e2eTestUtils/LabApiQueryParams";
import { AppTypes, AzureEnvironments } from "../../../e2eTestUtils/Constants";
import { 
    enterCredentials, 
    enterCredentialsWithConsent, 
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation
 } from "../../testUtils";

import { PublicClientApplication } from "../../../../lib/msal-node/dist";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

// Get flow-specific routes from sample application
const getTokenAuthCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD.json");

describe("Auth Code AAD PPE Tests", () => {
    jest.setTimeout(15000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;
    
    let username: string;
    let accountPwd: string;

    beforeAll(async() => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = 3000;
        homeRoute = `http://localhost:${port}`;

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD,
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
        let environment = "aad";
        let publicClientApplication: PublicClientApplication;
        let server: any;

        beforeAll(async () => {
            testName = "authCodeAcquireToken";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}/${environment}`);
            publicClientApplication = new PublicClientApplication({ auth: config.authOptions, cache: { cachePlugin }});
            server = getTokenAuthCode(config, publicClientApplication, port);
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterAll(async () => {
            if (server) {
                server.close();
            }
        });

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.on("dialog", async dialog => {
                console.log(dialog.message());
                await dialog.dismiss();
            });
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            await page.goto(homeRoute);
            await enterCredentials(page, screenshot, username, accountPwd);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'login'", async () => {
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentials(page, screenshot, username, accountPwd);

            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'consent'", async () => {
            await page.goto(`${homeRoute}/?prompt=consent`);
            await enterCredentialsWithConsent(page, screenshot, username, accountPwd);

            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'none'", async () => {
            // First log the user in first
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentials(page, screenshot, username, accountPwd);
            await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            
            // Reset the cache to prepare for the second login
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);

            // Login without a prompt 
            await page.goto(`${homeRoute}/?prompt=none`);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with state", async () => {
            const STATE_VALUE = "value_on_state";
            await page.goto(`${homeRoute}/?prompt=login&state=${STATE_VALUE}`);
            await enterCredentials(page, screenshot, username, accountPwd);
            const url = page.url();
            expect(url.includes(`state=${STATE_VALUE}`)).toBe(true);
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with login hint", async () => {
            const USERNAME = "test@domain.abc";
            await page.goto(`${homeRoute}/?prompt=login&loginHint=${USERNAME}`);
            await page.waitForSelector("#i0116");
            const emailInput = await page.$("#i0116");
            const email = await page.evaluate(element => element.value, emailInput);
            expect(email).toBe(USERNAME);
        });

        // NOTE: This test runs successfully only when we are running in headless mode
        it.skip("Performs acquire token with domain hint", async () => {
            const DOMAIN = "microsoft.com";
            const MS_LOGIN_URL = "msft.sts.microsoft.com";
            await page.goto(`${homeRoute}/?domainHint=${DOMAIN}`);
            await page.waitForNavigation({ waitUntil: 'networkidle2' });
            const url = await page.url();
            expect(url.includes(MS_LOGIN_URL)).toBe(true);
        });
    });
});