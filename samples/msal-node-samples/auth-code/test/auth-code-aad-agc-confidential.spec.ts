/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    RETRY_TIMES,
    enterCredentials,
    validateCacheLocation,
    SAMPLE_HOME_URL,
    NodeCacheTestUtils,
    AppTypes,
    LabApiQueryParams,
    LabClient,
    UserTypes,
    retrieveAppConfiguration,
    setupCredentials,
} from "e2e-test-utils";
import { ConfidentialClientApplication } from "@azure/msal-node";
import path from "path";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad-agc-confidential.cache.json`;

// Get flow-specific routes from sample application
const getTokenAuthCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD-AGC-Confidential.json");
config.resourceApi = {
    endpoint: "https://graph.microsoft.com/v1.0/me",
};

describe("Auth Code AAD AGC Confidential Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;

    let username: string;
    let password: string;

    const screenshotFolder = path.join(
        __dirname,
        "screenshots/auth-code/aad-agc-confidential"
    );

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = 3002;
        homeRoute = `http://localhost:${port}`;

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
        };
        config.request.authCodeUrlParameters.redirectUri = homeRoute;
        config.request.tokenRequest.redirectUri = homeRoute;
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        let confidentialClientApplication: ConfidentialClientApplication;
        let server: any;

        beforeAll(async () => {
            confidentialClientApplication = new ConfidentialClientApplication({
                auth: config.authOptions,
                cache: { cachePlugin },
            });
            server = getTokenAuthCode(
                config,
                confidentialClientApplication,
                port
            );
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
            page.on("dialog", async (dialog) => {
                console.log(dialog.message());
                await dialog.dismiss();
            });
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

        it("Performs acquire token", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/BaseCase`);
            await page.goto(homeRoute);
            await enterCredentials(page, screenshot, username, password);
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
            await enterCredentials(page, screenshot, username, password);
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
            await enterCredentials(page, screenshot, username, password);
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
            // First log the user in first
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentials(page, screenshot, username, password);
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);

            // Reset the cache to prepare for the second login
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);

            // Login without a prompt
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

        it("Generates state server-side", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/WithState`);
            const attackerSelectedState = "value_on_state";
            await page.goto(
                `${homeRoute}/?prompt=login&state=${attackerSelectedState}`
            );
            const generatedState = new URL(page.url()).searchParams.get(
                "state"
            );
            expect(generatedState).toBeTruthy();
            expect(generatedState).not.toBe(attackerSelectedState);
            await enterCredentials(page, screenshot, username, password);
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

        it("Rejects an authorization response with mismatched state", async () => {
            await page.goto(homeRoute);
            const response = await page.goto(
                `${homeRoute}/redirect?code=fake-code&state=invalid-state`
            );

            expect(response?.status()).toBe(400);
        });

        it("Passes login hint to the authorization request", async () => {
            const loginHint = "test@domain.abc";
            const authorizationRequest = page.waitForRequest((request) =>
                new URL(request.url()).pathname.endsWith(
                    "/oauth2/v2.0/authorize"
                )
            );

            await page.goto(
                `${homeRoute}/?prompt=login&loginHint=${encodeURIComponent(
                    loginHint
                )}`,
                { waitUntil: "domcontentloaded" }
            );

            const authorizationUrl = new URL(
                (await authorizationRequest).url()
            );
            expect(authorizationUrl.searchParams.get("login_hint")).toBe(
                loginHint
            );
        });
    });
});
