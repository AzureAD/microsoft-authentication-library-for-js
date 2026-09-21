/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    ONE_SECOND_IN_MS,
    RETRY_TIMES,
    clickSignIn,
    enterCredentials,
    SAMPLE_HOME_URL,
    SUCCESSFUL_GRAPH_CALL_ID,
    SUCCESSFUL_GET_ALL_ACCOUNTS_ID,
    validateCacheLocation,
    SUCCESSFUL_SILENT_TOKEN_ACQUISITION_ID,
    NodeCacheTestUtils,
    AppTypes,
    LabApiQueryParams,
    LabClient,
    UserTypes,
    retrieveAppConfiguration,
    setupCredentials,
} from "e2e-test-utils/node";
import { ConfidentialClientApplication, TokenCache } from "@azure/msal-node";
import path from "path";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad-agc-confidential.cache.json`;

// Get flow-specific routes from sample application
const getTokenSilent = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD-AGC-Confidential.json");
config.resourceApi = {
    endpoint: "https://graph.microsoft.com/v1.0/me",
};

describe("Silent Flow AAD AGC Confidential Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(ONE_SECOND_IN_MS * 90);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let homeRoute: string;

    let confidentialClientApplication: ConfidentialClientApplication;
    let msalTokenCache: TokenCache;
    let server: any;

    let username: string;
    let password: string;

    const screenshotFolder = path.join(
        __dirname,
        "screenshots/silent-flow/aad-agc-confidential"
    );

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        port = 3005;
        homeRoute = `${SAMPLE_HOME_URL}:${port}`;

        createFolder(screenshotFolder);

        const labClient = new LabClient();
        const userParams: LabApiQueryParams = {
            userType: UserTypes.GUEST,
        };
        const appParams: LabApiQueryParams = {
            appType: AppTypes.CLOUD,
            publicClient: "no",
            signInAudience: "azureadmyorg",
        };
        const [userConfig] = await labClient.getVarsByCloudEnvironment(
            userParams
        );
        const [appConfig] = await labClient.getVarsByCloudEnvironment(
            appParams
        );

        expect(appConfig.lab.tenantId).toBe(userConfig.lab.tenantId);
        [username, password] = await setupCredentials(userConfig, labClient);
        const [clientId, clientSecret, authority] =
            await retrieveAppConfiguration(appConfig, labClient, true);

        config.authOptions = {
            clientId,
            clientSecret,
            authority,
            redirectUri: homeRoute,
        };
        config.request.authCodeUrlParameters.redirectUri = homeRoute;
        config.request.tokenRequest.redirectUri = homeRoute;

        confidentialClientApplication = new ConfidentialClientApplication({
            auth: config.authOptions,
            cache: { cachePlugin },
        });
        msalTokenCache = confidentialClientApplication.getTokenCache();
        server = getTokenSilent(
            config,
            confidentialClientApplication,
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
            context = await browser.createBrowserContext();
            page = await context.newPage();
            await page.goto(homeRoute, { waitUntil: "networkidle0" });
        });

        afterEach(async () => {
            if (page) {
                await page.close();
            }
            if (context) {
                await context.close();
            }
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Auth Code flow", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/AcquireTokenAuthCode`
            );
            await clickSignIn(page, screenshot);
            await enterCredentials(page, screenshot, username, password);
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

        it("Rejects an authorization response with mismatched state", async () => {
            await page.goto(`${homeRoute}/login`);
            const response = await page.goto(
                `${homeRoute}/redirect?code=fake-code&state=invalid-state`
            );

            expect(response?.status()).toBe(400);
        });

        it("Performs acquire token silent", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/AcquireTokenSilent`
            );
            await clickSignIn(page, screenshot);
            await enterCredentials(page, screenshot, username, password);
            await page.waitForSelector("#acquireTokenSilent");
            await screenshot.takeScreenshot(page, "ATS");
            await page.click("#acquireTokenSilent");
            await page.waitForSelector(
                `#${SUCCESSFUL_SILENT_TOKEN_ACQUISITION_ID}`
            );
            await page.click("#callGraph");
            await page.waitForSelector("#graph-called-successfully");
            await screenshot.takeScreenshot(
                page,
                "acquireTokenSilentGotTokens"
            );
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(SUCCESSFUL_GRAPH_CALL_ID);
        });

        it("Refreshes an expired access token", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/RefreshExpiredToken`
            );
            await clickSignIn(page, screenshot);
            await enterCredentials(page, screenshot, username, password);
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
            await page.waitForSelector(
                `#${SUCCESSFUL_SILENT_TOKEN_ACQUISITION_ID}`
            );
            await page.click("#callGraph");
            await page.waitForSelector(`#${SUCCESSFUL_GRAPH_CALL_ID}`);
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

            expect(htmlBody).toContain(SUCCESSFUL_GRAPH_CALL_ID);
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
                context = await browser.createBrowserContext();
                page = await context.newPage();
                await page.goto(homeRoute, { waitUntil: "networkidle0" });
            });

            afterEach(async () => {
                if (page) {
                    await page.close();
                }
                if (context) {
                    await context.close();
                }
                await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            });

            it("Gets all cached accounts", async () => {
                const screenshot = new Screenshot(
                    `${screenshotFolder}/GetAllAccounts`
                );
                await clickSignIn(page, screenshot);
                await enterCredentials(page, screenshot, username, password);
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

            it("Does not allow another session to use the cached account", async () => {
                const screenshot = new Screenshot(
                    `${screenshotFolder}/SessionIsolation`
                );
                await clickSignIn(page, screenshot);
                await enterCredentials(page, screenshot, username, password);
                await page.waitForSelector("#acquireTokenSilent");

                const otherContext = await browser.createBrowserContext();
                const otherPage = await otherContext.newPage();
                try {
                    const response = await otherPage.goto(
                        `${homeRoute}/graphCall`
                    );
                    expect(response?.status()).toBe(401);
                } finally {
                    await otherPage.close();
                    await otherContext.close();
                }
            });
        });

        describe("Unauthenticated", () => {
            beforeEach(async () => {
                context = await browser.createBrowserContext();
                page = await context.newPage();
                await confidentialClientApplication.clearCache();
            });

            afterEach(async () => {
                if (page) {
                    await page.close();
                }
                if (context) {
                    await context.close();
                }
                await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
            });

            it("Rejects account access without an authenticated session", async () => {
                const screenshot = new Screenshot(
                    `${screenshotFolder}/NoCachedAccounts`
                );
                const response = await page.goto(`${homeRoute}/allAccounts`, {
                    waitUntil: "networkidle0",
                });
                await screenshot.takeScreenshot(page, "gotAllAccounts");
                expect(response?.status()).toBe(401);
            });
        });
    });
});
