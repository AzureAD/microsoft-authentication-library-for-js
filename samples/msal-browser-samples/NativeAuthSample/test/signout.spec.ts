/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    getBrowser,
    pcaInitializedPoller,
    BrowserCacheUtils,
    getHomeUrl,
    RETRY_TIMES,
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import path = require("path");
import { startCorsProxy, stopCorsProxy } from "./utils/proxyUtils";
import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    nativeAuthConfig,
} from "./utils/configUtils";
import {
    TokenVerificationUtils,
    BrowserStateUtils,
    UIInteractionUtils,
} from "./utils/testUtils";

// Use configuration instead of hardcoded values
const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/signout"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign Out Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let signInEmailUsername: string = "";
    let accountPwd: string = "";
    let corsProcess: ChildProcess;

    beforeAll(async () => {
        // Start the CORS proxy server using configuration values
        const tenantInfo = getTenantInfo();
        corsProcess = await startCorsProxy(
            tenantInfo.name,
            tenantInfo.id,
            getProxyPort()
        );

        if (testConfig.screenshots.enabled) {
            createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        }
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        // Use configuration for test user emails from JSON config
        signInEmailUsername = nativeAuthConfig.signInEmailPasswordUsername;
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
    });

    afterAll(async () => {
        await context?.close();
        await browser?.close();
        stopCorsProxy(corsProcess);
    });

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();

        BrowserCache = new BrowserCacheUtils(
            page,
            "sessionStorage" // Based on Native Auth Sample configuration
        ); // Navigate to the Native Auth Sample home page and wait for network idle to ensure full page load
    });

    afterEach(async () => {
        // Clear storage after each test using shared utility
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    });

    describe("Sign Out Flow - Email + Password", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-in button and click it
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignInBtn",
                "Show sign in button",
                STANDARD_TIMEOUT
            );

            // Verify sign-in card and form elements are visible
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "User sign-in with username and correct password, then sign out",
            async () => {
                const testName = "signInFormDisplay";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form using shared utility
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailUsername,
                    "Username field"
                );

                // Click sign-in button using shared utility
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter password using shared utility
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#signInPassword",
                    accountPwd,
                    "Password field"
                );
                await screenshot.takeScreenshot(page, "passwordInputEntered");

                // Submit password using shared utility
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitPasswordBtn",
                    "Submit password button",
                    STANDARD_TIMEOUT
                );
                await screenshot.takeScreenshot(page, "passwordSubmitted");

                // Wait for successful sign-in using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(
                    page,
                    AUTH_TIMEOUT
                );

                // Verify tokens and authentication using shared utility
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    BrowserCache
                );
                await screenshot.takeScreenshot(page, "signInSuccessful");

                // Click sign-out button using shared utility
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#navSignOutBtn",
                    "Sign out button",
                    STANDARD_TIMEOUT
                );
                await screenshot.takeScreenshot(page, "signOutButtonClicked");
                // Wait for the sign-out confirmation
                const authStatusBanner = await page.$eval(
                    "#authStatusBanner",
                    (el) => el.textContent
                );
                expect(authStatusBanner).toContain("No user signed in");
            },
            AUTH_TIMEOUT
        );
    });
});
