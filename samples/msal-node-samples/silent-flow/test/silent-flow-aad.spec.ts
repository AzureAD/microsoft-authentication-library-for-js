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
    clickSignIn,
    enterCredentials,
    SCREENSHOT_BASE_FOLDER_NAME,
    SAMPLE_HOME_URL,
    SUCCESSFUL_GRAPH_CALL_ID, 
    SUCCESSFUL_GET_ALL_ACCOUNTS_ID, 
    validateCacheLocation} from "../../testUtils";

import { PublicClientApplication, TokenCache } from "../../../../lib/msal-node/dist";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

// Get flow-specific routes from sample application
const getTokenSilent = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD.json");

describe("Silent Flow AAD PPE Tests", () => {
    jest.setTimeout(30000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let homeRoute: string;

    let publicClientApplication: PublicClientApplication;
    let msalTokenCache: TokenCache;
    let server: any;

    let username: string;
    let accountPwd: string;

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        port = 3002;
        homeRoute = `${SAMPLE_HOME_URL}:${port}`;

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.PPE,
            appType: AppTypes.CLOUD
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);

        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        publicClientApplication = new PublicClientApplication({ auth: config.authOptions, cache: { cachePlugin }});
        msalTokenCache = publicClientApplication.getTokenCache();
        server = getTokenSilent(config, publicClientApplication, port, msalTokenCache);
        await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
    });

    afterAll(async () => {
        await browser.close();
        if (server) {
            server.close();
        }
    });

    describe("AcquireToken", () => {
        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            await page.goto(homeRoute);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Auth Code flow", async () => {
            const testName = "AADAAcquireTokenAuthCode";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await clickSignIn(page, screenshot);
            await enterCredentials(page, screenshot, username, accountPwd);
            await page.waitForSelector("#acquireTokenSilent");
            await page.click("#acquireTokenSilent");
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token silent", async () => {
            const testName = "AADAcquireTokenSilent";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await clickSignIn(page, screenshot);
            await enterCredentials(page, screenshot, username, accountPwd);
            await page.waitForSelector("#acquireTokenSilent", { timeout: 0 });
            await screenshot.takeScreenshot(page, "ATS");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#graph-called-successfully");
            await screenshot.takeScreenshot(page, "acquireTokenSilentGotTokens");
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_GRAPH_CALL_ID);
        });

        it("Refreshes an expired access token", async () => {
            const testName = "AADRefreshExpiredToken";
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
            await clickSignIn(page, screenshot);
            await enterCredentials(page, screenshot, username, accountPwd);
            await page.waitForSelector("#acquireTokenSilent");

            let tokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            const originalAccessToken = tokens.accessTokens[0];
            await NodeCacheTestUtils.expireAccessTokens(TEST_CACHE_LOCATION);
            tokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            const expiredAccessToken = tokens.accessTokens[0];
            await page.click("#acquireTokenSilent");
            await page.waitForSelector(`#${SUCCESSFUL_GRAPH_CALL_ID}`);
            tokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            const refreshedAccessToken = tokens.accessTokens[0];
            await screenshot.takeScreenshot(page, "acquireTokenSilentGotTokens");
            const htmlBody = await page.evaluate(() => document.body.innerHTML);

            expect(htmlBody).toContain(SUCCESSFUL_GRAPH_CALL_ID);
            expect(Number(originalAccessToken.expiresOn)).toBeGreaterThan(0);
            expect(Number(expiredAccessToken.expiresOn)).toBe(0);
            expect(Number(refreshedAccessToken.expiresOn)).toBeGreaterThan(0);
            expect(refreshedAccessToken.secret).not.toEqual(originalAccessToken.secret);
        });
    });

    describe("Get All Accounts", () => {
        describe("Authenticated", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                await page.goto(homeRoute);
            });
        
            afterEach(async () => {
                await page.close();
                await context.close();
                await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            });
    
            it("Gets all cached accounts", async () => {
                const testName = "AADGetAllAccounts";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                await clickSignIn(page, screenshot);
                await enterCredentials(page, screenshot, username, accountPwd);
                await page.waitForSelector("#getAllAccounts");
                await page.click("#getAllAccounts");
                await page.waitForSelector(`#${SUCCESSFUL_GET_ALL_ACCOUNTS_ID}`);
                await screenshot.takeScreenshot(page, "gotAllAccounts");
                const accounts  = await page.evaluate(() => JSON.parse(document.getElementById("nav-tabContent").children[0].innerHTML));
                const htmlBody = await page.evaluate(() => document.body.innerHTML);
                expect(htmlBody).toContain(SUCCESSFUL_GET_ALL_ACCOUNTS_ID);
                expect(htmlBody).not.toContain("No accounts found in the cache.");
                expect(htmlBody).not.toContain("Failed to get accounts from cache.");
                expect(accounts.length).toBe(1);
            });
        });

        describe("Unauthenticated", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                await page.goto(homeRoute);
            });
        
            afterEach(async () => {
                await page.close();
                await context.close();
                await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            });

            it("Returns empty account array", async () => {
                const testName = "AADNoCachedAccounts";
                const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);
                await page.goto(`${homeRoute}/allAccounts`);
                await page.waitForSelector("#getAllAccounts");
                await page.click("#getAllAccounts");
                await screenshot.takeScreenshot(page, "gotAllAccounts");
                const accounts  = await page.evaluate(() => JSON.parse(document.getElementById("nav-tabContent").children[0].innerHTML));
                const htmlBody = await page.evaluate(() => document.body.innerHTML);
                expect(htmlBody).toContain("No accounts found in the cache.");
                expect(htmlBody).not.toContain("Failed to get accounts from cache.");
                expect(accounts.length).toBe(0);
            });
        });
    });
    
});