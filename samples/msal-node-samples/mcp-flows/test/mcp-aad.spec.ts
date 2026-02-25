/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    ONE_SECOND_IN_MS,
    RETRY_TIMES,
    clickSignIn,
    enterCredentials,
    SAMPLE_HOME_URL,
    validateCacheLocation,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    AppTypes,
    AzureEnvironments,
} from "e2e-test-utils";
import path from "path";
import { PublicClientApplication, TokenCache } from "@azure/msal-node";

const TEST_CACHE_LOCATION = `${__dirname}/data/cache.json`;

const getTokenMcp = require("../index");

const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

const config = require("../config/AAD.json");

const DIFFERENT_RESOURCE = "https://differentresource.microsoft.com";

describe("MCP Node AAD Tests", () => {
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

    const screenshotFolder = path.join(__dirname, "screenshots/mcp/aad");

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        port = 3000;
        homeRoute = `${SAMPLE_HOME_URL}:${port}`;

        createFolder(screenshotFolder);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        const envResponse = await labClient.getVarsByCloudEnvironment(labApiParms);
        [username, accountPwd] = await setupCredentials(envResponse[0], labClient);

        publicClientApplication = new PublicClientApplication({
            auth: config.authOptions,
            cache: { cachePlugin },
        });
        msalTokenCache = publicClientApplication.getTokenCache();
        server = getTokenMcp(config, publicClientApplication, port, msalTokenCache);
        await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
    });

    afterAll(async () => {
        await browser.close();
        if (server) {
            server.close();
        }
    });

    // Signs in via the auth code flow and waits until the post-redirect page is shown.
    const signIn = async (screenshot: Screenshot) => {
        await clickSignIn(page, screenshot);
        await enterCredentials(page, screenshot, username, accountPwd);
        await page.waitForSelector("#token-acquired");
    };

    describe("acquireTokenByCode", () => {
        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            await page.goto(homeRoute, { waitUntil: "networkidle0" });
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("stores resource in cached access token", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/acquireTokenByCode-storesResource`);
            await signIn(screenshot);

            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.accessTokens[0].resource).toBe(
                config.request.tokenRequest.resource
            );
        });
    });

    describe("acquireTokenSilent", () => {
        beforeEach(async () => {
            context = await browser.createBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(ONE_SECOND_IN_MS * 5);
            await page.goto(homeRoute, { waitUntil: "networkidle0" });
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("returns cached token when resource matches", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/acquireTokenSilent-cacheHit`);
            await signIn(screenshot);

            const tokensBefore = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            const atSecretBefore = tokensBefore.accessTokens[0].secret;

            await page.goto(`${homeRoute}/silent`, { waitUntil: "networkidle0" });
            await page.waitForSelector("#token-acquired-silently");

            const tokensAfter = await NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            // No new token written; same secret means the cached AT was returned
            expect(tokensAfter.accessTokens.length).toBe(1);
            expect(tokensAfter.accessTokens[0].secret).toBe(atSecretBefore);
        });

        it("stores resource on new access token when falling back via refresh token", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/acquireTokenSilent-refreshFallback`);
            await signIn(screenshot);

            await NodeCacheTestUtils.expireAccessTokens(TEST_CACHE_LOCATION);

            await page.goto(`${homeRoute}/silent`, { waitUntil: "networkidle0" });
            await page.waitForSelector("#token-acquired-silently");

            const tokensAfter = await NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(tokensAfter.accessTokens.length).toBeGreaterThan(0);
            expect(tokensAfter.accessTokens[0].resource).toBe(
                config.request.silentRequest.resource
            );
        });

        it("falls back to network when resource does not match cached access token", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/acquireTokenSilent-cacheMiss`);
            await signIn(screenshot);

            const tokensBefore = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                ONE_SECOND_IN_MS * 2
            );
            expect(tokensBefore.accessTokens.length).toBe(1);
            expect(tokensBefore.accessTokens[0].resource).toBe(
                config.request.silentRequest.resource
            );

            await page.goto(
                `${homeRoute}/silent?resource=${encodeURIComponent(DIFFERENT_RESOURCE)}`,
                { waitUntil: "networkidle0" }
            );
            await page.waitForSelector("#token-acquired-silently");

            const tokensAfter = await NodeCacheTestUtils.getTokens(TEST_CACHE_LOCATION);
            expect(tokensAfter.accessTokens.length).toBe(1);
            expect(tokensAfter.accessTokens[0].resource).toBe(DIFFERENT_RESOURCE);
        });
    });
});
