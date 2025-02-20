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
    enterCredentials,
    validateCacheLocation,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    AppTypes,
    AzureEnvironments,
} from "e2e-test-utils";
import path from "path";

import { PublicClientApplication } from "@azure/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/data/cache.json`;

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/AAD.json");

describe("Auth Code CLI AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    let username: string;
    let accountPwd: string;

    const screenshotFolder = path.join(__dirname, "screenshots/auth-code-cli-app");

    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;

        createFolder(screenshotFolder);

        const labApiParms: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
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

    describe("Acquire Token Interactive", () => {
        let publicClientApplication: PublicClientApplication;

        beforeEach(async () => {
            publicClientApplication = new PublicClientApplication({
                auth: config.authOptions,
                cache: { cachePlugin },
            });
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await page.close();
            await context.close();
        });

        it("Performs acquire token", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/BaseCase`);
            const openBrowser = async (url: string) => {
                context = await browser.createBrowserContext();
                page = await context.newPage();
                page.setDefaultTimeout(5000);
                page.goto(url);
                enterCredentials(page, screenshot, username, accountPwd);
            };
            const successMessage = "Success. You can close the browser now";
            const result =
                await publicClientApplication.acquireTokenInteractive({
                    scopes: config.request.scopes,
                    openBrowser: openBrowser,
                    successTemplate: successMessage,
                });
            expect(result.accessToken).toBeTruthy();
            expect(result.idToken).toBeTruthy();
            expect(result.account.username).toEqual(username);

            try {
                expect(
                    (await page.content()).match(successMessage)
                ).toBeTruthy();
            } finally {
                await screenshot.takeScreenshot(page, "Success Template");
            }

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
