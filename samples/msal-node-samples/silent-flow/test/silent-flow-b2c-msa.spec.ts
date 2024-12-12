/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    b2cMsaAccountEnterCredentials,
    ONE_SECOND_IN_MS,
    RETRY_TIMES,
    clickSignIn,
    SCREENSHOT_BASE_FOLDER_NAME,
    SAMPLE_HOME_URL,
    SUCCESSFUL_GET_ALL_ACCOUNTS_ID,
    validateCacheLocation,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    B2cProviders,
    UserTypes,
    B2C_MSA_TEST_UPN,
} from "e2e-test-utils";

import { PublicClientApplication, TokenCache } from "@azure/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/b2c-msa.cache.json`;

// Get flow-specific routes from sample application
const getTokenSilent = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/B2C-MSA.json");

describe("Silent Flow B2C Tests (msa account)", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(ONE_SECOND_IN_MS * 45);
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

    const screenshotFolder = `${SCREENSHOT_BASE_FOLDER_NAME}/silent-flow/b2c/msa-account`;

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;

        // To run tests in parallel, each test needs to run on a unique port
        port = 3008;
        homeRoute = `${SAMPLE_HOME_URL}:${port}`;

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        const labApiParms: LabApiQueryParams = {
            userType: UserTypes.B2C,
            b2cProvider: B2cProviders.MICROSOFT,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(
            labApiParms
        );
        [username, accountPwd] = await setupCredentials(
            envResponse[0],
            labClient
        );

        // TODO: Remove when B2C MSA account is available in the lab
        username = B2C_MSA_TEST_UPN;

        publicClientApplication = new PublicClientApplication({
            auth: config.authOptions,
            cache: { cachePlugin },
        });

        msalTokenCache = publicClientApplication.getTokenCache();
        server = getTokenSilent(
            config,
            publicClientApplication,
            port,
            msalTokenCache
        );
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
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            await page.goto(homeRoute, { waitUntil: "networkidle0" });
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Auth Code flow", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/AcquireTokenAuthCode`
            );
            await clickSignIn(page, screenshot);
            await b2cMsaAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );
            await page.waitForSelector("#acquireTokenSilent");
            await page.click("#acquireTokenSilent");
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token silent", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/AcquireTokenSilent`
            );
            await clickSignIn(page, screenshot);
            await b2cMsaAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );
            await page.waitForSelector("#acquireTokenSilent");
            await screenshot.takeScreenshot(page, "ATS");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#token-acquired-silently");
            await screenshot.takeScreenshot(
                page,
                "acquireTokenSilentGotTokens"
            );
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain("Silent token acquisition successful");
        });

        it("Refreshes an expired access token", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/RefreshExpiredToken`
            );
            await clickSignIn(page, screenshot);
            await b2cMsaAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );
            await page.waitForSelector("#acquireTokenSilent");

            let tokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            const originalAccessToken = tokens.accessTokens[0];
            await NodeCacheTestUtils.expireAccessTokens(TEST_CACHE_LOCATION);
            tokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            const expiredAccessToken = tokens.accessTokens[0];

            // Wait to ensure new token has new iat
            await new Promise((r) => setTimeout(r, ONE_SECOND_IN_MS));
            await page.click("#acquireTokenSilent");
            await page.waitForSelector("#token-acquired-silently");
            tokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            const refreshedAccessToken = tokens.accessTokens[0];
            await screenshot.takeScreenshot(
                page,
                "acquireTokenSilentGotTokens"
            );
            const htmlBody = await page.evaluate(() => document.body.innerHTML);

            expect(htmlBody).toContain("Silent token acquisition successful");
            expect(Number(originalAccessToken.expiresOn)).toBeGreaterThan(0);
            expect(Number(expiredAccessToken.expiresOn)).toBe(0);
            expect(Number(refreshedAccessToken.expiresOn)).toBeGreaterThan(0);
            expect(refreshedAccessToken.secret).not.toEqual(
                originalAccessToken.secret
            );
        });
    });

    describe("Get All Accounts", () => {
        describe("Authenticated", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                await page.goto(homeRoute, { waitUntil: "networkidle0" });
            });

            afterEach(async () => {
                await page.close();
                await context.close();
                await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            });

            it("Gets all cached accounts", async () => {
                const screenshot = new Screenshot(
                    `${screenshotFolder}/GetAllAccounts`
                );
                await clickSignIn(page, screenshot);
                await b2cMsaAccountEnterCredentials(
                    page,
                    screenshot,
                    username,
                    accountPwd
                );
                await page.waitForSelector("#getAllAccounts");
                await page.click("#getAllAccounts");
                await page.waitForSelector(
                    `#${SUCCESSFUL_GET_ALL_ACCOUNTS_ID}`
                );
                await screenshot.takeScreenshot(page, "gotAllAccounts");
                const accounts = await page.evaluate(() =>
                    JSON.parse(
                        document.getElementById("nav-tabContent").children[0]
                            .innerHTML
                    )
                );
                const htmlBody = await page.evaluate(
                    () => document.body.innerHTML
                );
                expect(htmlBody).toContain(SUCCESSFUL_GET_ALL_ACCOUNTS_ID);
                expect(htmlBody).not.toContain(
                    "No accounts found in the cache."
                );
                expect(htmlBody).not.toContain(
                    "Failed to get accounts from cache."
                );
                expect(accounts.length).toBe(1);
            });
        });

        describe("Unauthenticated", () => {
            beforeEach(async () => {
                context = await browser.createIncognitoBrowserContext();
                page = await context.newPage();
                await publicClientApplication.clearCache();
            });

            afterEach(async () => {
                await page.close();
                await context.close();
                await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            });

            it("Returns empty account array", async () => {
                const screenshot = new Screenshot(
                    `${screenshotFolder}/NoCachedAccounts`
                );
                await page.goto(`${homeRoute}/allAccounts`, {
                    waitUntil: "networkidle0",
                });
                await page.waitForSelector("#getAllAccounts");
                await page.click("#getAllAccounts");
                await screenshot.takeScreenshot(page, "gotAllAccounts");
                const accounts = await page.evaluate(() =>
                    JSON.parse(
                        document.getElementById("nav-tabContent").children[0]
                            .innerHTML
                    )
                );
                const htmlBody = await page.evaluate(
                    () => document.body.innerHTML
                );
                expect(htmlBody).toContain("No accounts found in the cache.");
                expect(htmlBody).not.toContain(
                    "Failed to get accounts from cache."
                );
                expect(accounts.length).toBe(0);
            });
        });
    });
});
