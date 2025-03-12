/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    enterCredentials
    validateCacheLocation,
    SAMPLE_HOME_URL,
    NodeCacheTestUtils,
    LabClient,
    LabApiQueryParams,
    AppTypes,
    AzureEnvironments,
} from "e2e-test-utils";
import { ConfidentialClientApplication, LogLevel } from "@azure/msal-node";
import path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const { acquireTokenByCode } = require("../web-app/index");
const { acquireTokenObo } = require("../web-api/index");

const webAppConfig = require("../config/WEB-APP.json");
webAppConfig.authOptions.clientId = process.env.OBO_WEB_APP_CLIENT_ID;
webAppConfig.authOptions.clientSecret = process.env.OBO_WEB_APP_CLIENT_SECRET;

const webApiConfig = require("../config/WEB-API.json");
webApiConfig.authOptions.clientId = process.env.OBO_WEB_API_CLIENT_ID;
webApiConfig.authOptions.clientSecret = process.env.OBO_WEB_API_CLIENT_SECRET;
webApiConfig.webApiScope = process.env.OBO_WEB_API_SCOPE;
webApiConfig.authOptions.authority = `https://login.microsoftonline.com/${process.env.OBO_WEB_API_TENANT_ID}`;
webApiConfig.discoveryKeysEndpoint = `https://login.microsoftonline.com/${process.env.OBO_WEB_API_TENANT_ID}/discovery/v2.0/keys`;

const WEB_APP_TEST_CACHE_LOCATION = `${__dirname}/data/webAppCache.json`;
const webAppCachePlugin = require("../../cachePlugin.js")(
    WEB_APP_TEST_CACHE_LOCATION
);

const WEB_API_TEST_CACHE_LOCATION = `${__dirname}/data/webApiCache.json`;
const webApiCachePlugin = require("../../cachePlugin.js")(
    WEB_API_TEST_CACHE_LOCATION
);

const HOME_ROUTE = `http://localhost:${webAppConfig.serverPort}`;

describe("OBO AAD Tests", () => {
    jest.retryTimes(1);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;

    let username: string;
    let accountPwd: string;

    const screenshotFolder = path.join(__dirname, "screenshots/on-behalf-of")

    beforeAll(async () => {
        await validateCacheLocation(WEB_APP_TEST_CACHE_LOCATION);
        await validateCacheLocation(WEB_API_TEST_CACHE_LOCATION);
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

    describe("Acquire Token", () => {
        let webAppConfidentialClient: ConfidentialClientApplication;
        let webApiConfidentialClient: ConfidentialClientApplication;
        let webAppServer: any;
        let webApiServer: any;

        const loggerOptions = {
            loggerCallback(
                loglevel: LogLevel,
                message: String,
                containsPii: Boolean
            ) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };

        beforeAll(async () => {
            webAppConfidentialClient = new ConfidentialClientApplication({
                auth: webAppConfig.authOptions,
                cache: { cachePlugin: webAppCachePlugin },
                system: { loggerOptions },
            });
            webApiConfidentialClient = new ConfidentialClientApplication({
                auth: webApiConfig.authOptions,
                cache: { cachePlugin: webApiCachePlugin },
                system: { loggerOptions },
            });
            webAppServer = acquireTokenByCode(
                webAppConfidentialClient,
                webAppConfig.serverPort,
                webApiConfig.serverPort,
                webAppConfig.redirectUri,
                webApiConfig.webApiScope
            );
            webApiServer = acquireTokenObo(
                webApiConfidentialClient,
                webApiConfig.serverPort,
                webApiConfig.authOptions.clientId,
                webApiConfig.authOptions.authority,
                webApiConfig.discoveryKeysEndpoint
            );
            await NodeCacheTestUtils.resetCache(WEB_APP_TEST_CACHE_LOCATION);
            await NodeCacheTestUtils.resetCache(WEB_API_TEST_CACHE_LOCATION);
        });

        afterAll(async () => {
            if (webAppServer) {
                webAppServer.close();
            }

            if (webApiServer) {
                webApiServer.close();
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
            await NodeCacheTestUtils.resetCache(WEB_APP_TEST_CACHE_LOCATION);
            await NodeCacheTestUtils.resetCache(WEB_API_TEST_CACHE_LOCATION);
        });

        it("Performs acquire token via OBO flow", async () => {
            const screenshot = new Screenshot(`${screenshotFolder}/BaseCase`);
            await page.goto(HOME_ROUTE);
            await enterCredentials(page, screenshot, username, accountPwd);
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );

            const webApiCachedTokens = await NodeCacheTestUtils.waitForTokens(
                WEB_API_TEST_CACHE_LOCATION,
                2000
            );
            expect(webApiCachedTokens.accessTokens.length).toBe(1);
            expect(webApiCachedTokens.idTokens.length).toBe(1);
            expect(webApiCachedTokens.refreshTokens.length).toBe(1);

            const accounts = await NodeCacheTestUtils.getAccounts(
                WEB_API_TEST_CACHE_LOCATION
            );
            expect(Object.keys(accounts).length).toBe(1);

            const account = Object.values(accounts)[0];
            expect(account.username).toEqual(username);
        });
    });
});
