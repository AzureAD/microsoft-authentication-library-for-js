/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import fs from "fs";
import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    b2cLocalAccountEnterCredentials,
    RETRY_TIMES,
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation,
    SAMPLE_HOME_URL,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    B2cProviders,
    UserTypes,
} from "e2e-test-utils";

import { LogLevel, PublicClientApplication } from "@azure/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/b2c-local.cache.json`;

// Get flow-specific routes from sample application
const getTokenAuthCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/B2C-Local.json");

describe("Auth Code B2C Tests (local account)", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: number;
    let homeRoute: string;

    let username: string;
    let accountPwd: string;
    const logFile = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});

    const screenshotFolder = `${SCREENSHOT_BASE_FOLDER_NAME}/auth-code/b2c/local-account`;

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore

        // To run tests in parallel, each test needs to run on a unique port
        port = 3005;
        homeRoute = `http://localhost:${port}`;

        createFolder(screenshotFolder);

        const labApiParms: LabApiQueryParams = {
            userType: UserTypes.B2C,
            b2cProvider: B2cProviders.LOCAL,
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
                system: {
                    loggerOptions: {
                        loggerCallback(loglevel, message, containsPii) {
                            logFile.write(message + "\n");
                        },
                        logLevel: LogLevel.Verbose
                    },
                }
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
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
            page.setDefaultTimeout(10000);
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
            await page.goto(homeRoute);
            await b2cLocalAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );

            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await screenshot.takeScreenshot(page, "credentialsSubmitted");
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
            await b2cLocalAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );

            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await screenshot.takeScreenshot(page, "credentialsSubmitted");

            const cachedTokens = await NodeCacheTestUtils.waitForTokens(
                TEST_CACHE_LOCATION,
                2000
            );
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
        });

        it("Performs acquire token with prompt = 'select_account'", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/PromptSelectAccount`
            );
            await page.goto(`${homeRoute}/?prompt=select_account`);
            await b2cLocalAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );

            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await screenshot.takeScreenshot(page, "credentialsSubmitted");

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
            await b2cLocalAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );

            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await screenshot.takeScreenshot(page, "credentialsSubmitted");
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
            const STATE_VALUE = "value_on_state";
            await page.goto(`${homeRoute}/?prompt=login&state=${STATE_VALUE}`);
            await b2cLocalAccountEnterCredentials(
                page,
                screenshot,
                username,
                accountPwd
            );

            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await screenshot.takeScreenshot(page, "credentialsSubmitted");
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
    });
});
