/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    b2cMsaAccountEnterCredentials,
    RETRY_TIMES,
    validateCacheLocation,
    SAMPLE_HOME_URL,
    NodeCacheTestUtils,
    LabResponseHelper,
    KeyVaultSecrets,
    LabUser,
    getMsidLabKeyVaultProvider,
} from "e2e-test-utils";
import path from "path";

import { ConfidentialClientApplication } from "@azure/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/../data/b2c-msa.cache.json`;

// Get flow-specific routes from sample application
const main = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/B2C-MSA.json");

describe("B2C User Flow Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;

    let labUser: LabUser;
    let labPassword: string;
    let clientSecret: string;

    const screenshotFolder = path.join(
        __dirname,
        "screenshots/b2c-user-flows/msa"
    );

    beforeAll(async () => {
        createFolder(screenshotFolder);
        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = 3001;
        homeRoute = `http://localhost:${port}`;

        // Get B2C user configuration from Key Vault
        labUser = await LabResponseHelper.getLabUser(
            KeyVaultSecrets.UserB2CMSA
        );
        labPassword = await labUser.getPassword();

        // Get B2C MSA app secret from Key Vault
        const kvProvider = getMsidLabKeyVaultProvider();
        clientSecret = await kvProvider.getSecretValue(
            KeyVaultSecrets.B2CMsaAppSecretName
        );
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("User flows (msa account)", () => {
        let cca: ConfidentialClientApplication;
        let server: any;

        beforeAll(async () => {
            cca = new ConfidentialClientApplication({
                auth: {
                    clientId: config.authOptions.clientId,
                    clientSecret: clientSecret,
                    authority:
                        config.policies.authorities.signUpSignIn.authority,
                    knownAuthorities: [config.policies.authorityDomain],
                },
                cache: {
                    cachePlugin,
                },
            });

            server = main(config, cca, port, config.authOptions.redirectUri);
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

        it("Performs edit profile", async () => {
            const screenshot = new Screenshot(
                `${screenshotFolder}/edit-profile`
            );
            await page.goto(homeRoute);
            await page.click("#signIn");
            await b2cMsaAccountEnterCredentials(
                page,
                screenshot,
                labUser.upn,
                labPassword
            );
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await page.click("#editProfile");
            await page.waitForSelector("#attributeVerification");
            let displayName = (Math.random() + 1).toString(36).substring(7); // generate a random string
            await page.$eval("#displayName", (el: any) => (el.value = "")); // clear the text field
            await page.type("#displayName", `${displayName}`);
            await page.click("#continue");
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );
            await page.click("#viewId");
            await page.waitForSelector("#idTokenInfo");
            const htmlBody = await page.evaluate(() => document.body.innerHTML);
            expect(htmlBody).toContain(`${displayName}`);
        });
    });
});
