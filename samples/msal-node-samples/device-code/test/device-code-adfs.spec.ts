/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    RETRY_TIMES,
    enterCredentialsADFSWithConsent,
    enterDeviceCode,
    validateCacheLocation,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    AppTypes,
    AzureEnvironments,
    FederationProviders,
    UserTypes,
} from "e2e-test-utils";
import path from "path";
import { Configuration, PublicClientApplication } from "@azure/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/adfs.cache.json`;

// Get flow-specific routes from sample application
const getTokenDeviceCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/ADFS.json");

describe("Device Code ADFS 2019 Tests", () => {
    jest.setTimeout(45000);
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let publicClientApplication: PublicClientApplication;
    let clientConfig: Configuration;

    let username: string;
    let accountPwd: string;

    const screenshotFolder = path.join(__dirname, "screenshots/device-code/adfs");

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        createFolder(screenshotFolder);

        // Configure Lab API Query Parameters
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
                await enterCredentialsADFSWithConsent(
                    page,
                    screenshot,
                    username,
                    accountPwd
                );
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
