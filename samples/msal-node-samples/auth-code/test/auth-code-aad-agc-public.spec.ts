/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import { Screenshot, enterCredentials, SAMPLE_HOME_URL } from "e2e-test-utils";
import {
    LabResponseHelper,
    KeyVaultSecrets,
    LabUser,
    AppConfig,
    NodeCacheTestUtils,
    validateCacheLocation,
    createFolder,
    RETRY_TIMES,
} from "lab-utils";
import { PublicClientApplication } from "@azure/msal-node";
import path from "path";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad-agc-public.cache.json`;

// Get flow-specific routes from sample application
const getTokenAuthCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD-AGC-Public.json");

describe("Auth Code AAD AGC Public Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;

    let labUser: LabUser;
    let appConfig: AppConfig;

    const screenshotFolder = path.join(
        __dirname,
        "screenshots/auth-code/aad-agc-public"
    );

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = 3003;
        homeRoute = `http://localhost:${port}`;

        createFolder(screenshotFolder);

        labUser = await LabResponseHelper.getLabUser(
            KeyVaultSecrets.UserArlington
        );
        appConfig = await LabResponseHelper.getAppConfig(
            KeyVaultSecrets.ArlAppIdLabsApp
        );

        // Configure auth options from Key Vault app config
        config.authOptions = {
            clientId: appConfig.appId,
            authority: appConfig.authority,
            knownAuthorities: appConfig.authority
                ? [new URL(appConfig.authority).origin]
                : [],
        };
        config.resourceApi = {
            endpoint: appConfig.authority
                ? `${new URL(appConfig.authority).origin}/v1.0/me`
                : undefined,
        };
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
            page.on("dialog", async (dialog) => {
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
            const screenshot = new Screenshot(`${screenshotFolder}/BaseCase`);
            const password = await labUser.getPassword();
            await page.goto(homeRoute);
            await enterCredentials(page, screenshot, labUser.upn, password);
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
            const password = await labUser.getPassword();
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentials(page, screenshot, labUser.upn, password);
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
            const password = await labUser.getPassword();
            await page.goto(`${homeRoute}/?prompt=consent`);
            await enterCredentials(page, screenshot, labUser.upn, password);
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
            const password = await labUser.getPassword();
            // First log the user in first
            await page.goto(`${homeRoute}/?prompt=login`);
            await enterCredentials(page, screenshot, labUser.upn, password);
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

        it("Performs acquire token with state", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/WithState`);
            const password = await labUser.getPassword();
            const STATE_VALUE = "value_on_state";
            await page.goto(`${homeRoute}/?prompt=login&state=${STATE_VALUE}`);
            await enterCredentials(page, screenshot, labUser.upn, password);
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

            // agce: which type of account do you want to use
            try {
                await page.waitForSelector("#aadTile", { timeout: 1000 });
                await Promise.all([
                    page.waitForNavigation({
                        waitUntil: ["load", "domcontentloaded", "networkidle0"],
                    }),
                    page.click("#aadTile"),
                ]).catch(async (e) => {
                    throw e;
                });
            } catch (e) {
                //
            }

            await page.waitForSelector("#displayName");
            const emailInput = await page.$("#displayName");
            const email = await page.evaluate(
                (element) => element.innerText,
                emailInput
            );
            expect(email).toBe(USERNAME);
        });
    });
});
