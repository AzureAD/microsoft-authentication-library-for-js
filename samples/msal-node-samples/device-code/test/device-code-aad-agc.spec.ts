/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    RETRY_TIMES,
    approveRemoteConnect,
    enterCredentials,
    enterDeviceCode,
    validateCacheLocation,
    NodeCacheTestUtils,
    getKeyVaultSecretClient,
    getCredentials,
} from "e2e-test-utils";
import { Configuration, PublicClientApplication } from "@azure/msal-node";
import path from "path";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad-agc.cache.json`;

// Get flow-specific routes from sample application
const getTokenDeviceCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD-AGC.json");
config.authOptions = {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `${process.env.AUTHORITY}/${process.env.AZURE_TENANT_ID}`,
    knownAuthorities: [
        `${process.env.AUTHORITY}/${process.env.AZURE_TENANT_ID}`,
    ],
};
config.resourceApi = {
    endpoint: `${process.env.GRAPH_URL}/v1.0/me`,
};

describe("Device Code AAD AGC Tests", () => {
    jest.setTimeout(45000);
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let publicClientApplication: PublicClientApplication;
    let clientConfig: Configuration;

    let username: string;
    let password: string;

    const screenshotFolder = path.join(__dirname, "screenshots/device-code/aad-agc");

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        createFolder(screenshotFolder);

        const keyVaultSecretClient = await getKeyVaultSecretClient();
        [username, password] = await getCredentials(keyVaultSecretClient);
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("Acquire Token", () => {
        beforeAll(async () => {
            clientConfig = { auth: config.authOptions, cache: { cachePlugin } };
            publicClientApplication = new PublicClientApplication(clientConfig);
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

        it("Performs acquire token with Device Code flow", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/BaseCase`);

            const deviceCodeCallback = async (deviceCodeResponse: any) => {
                const { userCode, verificationUri } = deviceCodeResponse;
                await enterDeviceCode(
                    page,
                    screenshot,
                    userCode,
                    verificationUri
                );
                await approveRemoteConnect(page, screenshot);
                await enterCredentials(page, screenshot, username, password);
                await page.waitForSelector("#message");
                await screenshot.takeScreenshot(
                    page,
                    "SuccessfulDeviceCodeMessage"
                );
            };

            await getTokenDeviceCode(config, publicClientApplication, {
                deviceCodeCallback: deviceCodeCallback,
            });
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
