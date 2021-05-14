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
    approveRemoteConnect,
    enterCredentials,
    enterDeviceCode,
    SCREENSHOT_BASE_FOLDER_NAME,
    validateCacheLocation
 } from "../../testUtils";

import { Configuration, PublicClientApplication } from "../../../../lib/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;

// Get flow-specific routes from sample application
const getTokenDeviceCode = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD.json");

describe('Device Code AAD PPE Tests', () => {
    jest.setTimeout(30000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let publicClientApplication: PublicClientApplication;
    let clientConfig: Configuration;
    
    let username: string;
    let accountPwd: string;
    
    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);

        // Configure Lab API Query Parameters
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

        beforeAll(async () => {
            clientConfig = { auth: config.authOptions, cache: { cachePlugin } };
            publicClientApplication = new PublicClientApplication(clientConfig);
        });

        beforeEach(async () => {
            context = await browser.createIncognitoBrowserContext();
            page = await context.newPage();
        });

        afterEach(async () => {
            await page.close();
            await context.close();
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token with Device Code flow", async () => {
            testName = "AADAcquireTokenWithDeviceCode";
            screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`);

            const deviceCodeCallback = async (deviceCodeResponse: any) => {
                const { userCode, verificationUri} = deviceCodeResponse;
                await enterDeviceCode(page, screenshot, userCode, verificationUri);
                await approveRemoteConnect(page, screenshot);
                await enterCredentials(page, screenshot, username, accountPwd);
                await page.waitForSelector("#message");
                await screenshot.takeScreenshot(page, "SuccessfulDeviceCodeMessage");
            };
            
            await getTokenDeviceCode(config, publicClientApplication, { deviceCodeCallback: deviceCodeCallback });
            const cachedTokens = await NodeCacheTestUtils.waitForTokens(TEST_CACHE_LOCATION, 2000);
            expect(cachedTokens.accessTokens.length).toBe(1);
            expect(cachedTokens.idTokens.length).toBe(1);
            expect(cachedTokens.refreshTokens.length).toBe(1);
         });
    });
});