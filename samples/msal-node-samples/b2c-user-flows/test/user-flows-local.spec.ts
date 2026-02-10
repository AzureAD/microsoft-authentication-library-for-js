/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    b2cLocalAccountEnterCredentials,
    SAMPLE_HOME_URL,
} from "e2e-test-utils";
import {
    LabResponseHelper,
    KeyVaultSecrets,
    LabUser,
    NodeCacheTestUtils,
    validateCacheLocation,
    createFolder,
    RETRY_TIMES,
} from "lab-utils";
import path from "path";

import { ConfidentialClientApplication } from "@azure/msal-node";

// Set test cache name/location
const TEST_CACHE_LOCATION = `${__dirname}/../data/b2c-local.cache.json`;

// Get flow-specific routes from sample application
const main = require("../index");

// Build cachePlugin
const cachePlugin = require("../../cachePlugin.js")(TEST_CACHE_LOCATION);

// Load scenario configuration
const config = require("../config/B2C-Local.json");

describe("B2C User Flow Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(45000);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let port: string;
    let homeRoute: string;

    let labUser: LabUser;
    let accountPwd: string;
    let clientSecret: string;

    const screenshotFolder = path.join(
        __dirname,
        "screenshots/b2c-user-flows/local"
    );

    beforeAll(async () => {
        createFolder(screenshotFolder);

        await validateCacheLocation(TEST_CACHE_LOCATION);
        // @ts-ignore
        browser = await global.__BROWSER__;
        // @ts-ignore
        port = 3000;
        homeRoute = `http://localhost:${port}`;

        labUser = await LabResponseHelper.getLabUser(KeyVaultSecrets.UserB2C);
        accountPwd = await labUser.getPassword();
        clientSecret = await LabResponseHelper.getMsidLabSecret(
            "MSIDLABB2C-MSAapp-AppSecret"
        );
    });

    afterAll(async () => {
        await browser.close();
    });

    describe("User flows (local account)", () => {
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
            let displayName = (Math.random() + 1).toString(36).substring(7); // generate a random string
            await page.goto(homeRoute);
            await screenshot.takeScreenshot(page, "homePage");
            const [response] = await Promise.all([
                page.waitForNavigation(),
                page.click("#signIn"),
            ]);
            await b2cLocalAccountEnterCredentials(
                page,
                screenshot,
                labUser.upn,
                accountPwd
            );
            await page.waitForFunction(
                `window.location.href.startsWith("${SAMPLE_HOME_URL}")`
            );

            await page.click("#editProfile");
            await page.waitForSelector("#attributeVerification");

            await page.$eval("#displayName", (el: any) => (el.value = "")), // clear the text field
                await page.type("#displayName", `${displayName}`),
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
