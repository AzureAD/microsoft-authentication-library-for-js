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
    ONE_SECOND_IN_MS,
    LabClient,
    getHomeUrl,
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import path = require("path");
import { startCorsProxy, stopCorsProxy } from "./proxyUtils";

import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    getTestUsers,
    getTestData,
    nativeAuthConfig,
} from "./configUtils";

// Use configuration instead of hardcoded values
const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/signout"
);
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign Out Tests", () => {
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
        // Clear storage after each test
        await page.evaluate(() => {
            Object.assign({}, window.sessionStorage.clear());
        });
        await page.evaluate(() => {
            Object.assign({}, window.localStorage.clear());
        });
        await page.close();
    });

    describe("Sign Out Flow - Email + Password", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability

            // Verify that no user signed in initially
            const authStatusBanner = await page.$eval(
                "#authStatusBanner",
                (el) => el.textContent
            );
            expect(authStatusBanner).toContain("No user signed in");

            // Verify sign-in button is visible on the navigation bar
            const showSignInBtn = await page.$("#showSignInBtn");
            expect(showSignInBtn).toBeTruthy();

            // Click sign-in button on the navigation bar
            await page.click("#showSignInBtn");

            // Verify sign-in card is visible
            const signInCard = await page.$("#signInCard");
            expect(signInCard).toBeTruthy();

            // Verify sign-in form elements are present
            const usernameInput = await page.$("#username");
            const signInButton = await page.$("#signInBtn");
            expect(usernameInput).toBeTruthy();
            expect(signInButton).toBeTruthy();

            // Verify the form is visible
            const isSignInCardVisible = await page.evaluate(() => {
                const card = document.getElementById("signInCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isSignInCardVisible).toBe(true);
        });

        it(
            "User sign-in with username and correct password, then sign out",
            async () => {
                const testName = "signInFormDisplay";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailUsername);

                // Make sure sign-in button is visible and clickable
                await page.waitForSelector("#signInBtn", { visible: true });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const signInButton = document.getElementById("signInBtn");
                    if (signInButton) {
                        signInButton.click();
                    } else {
                        throw new Error("Sign in button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                    timeout: 30000,
                });
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter password and submit - ensure password field is fully visible first
                await page.waitForSelector("#signInPassword", {
                    visible: true,
                    timeout: 30000,
                });
                await page.type("#signInPassword", accountPwd);
                await screenshot.takeScreenshot(page, "passwordInputEntered");

                // Wait for the submit button to be visible and enabled
                await page.waitForSelector("#submitPasswordBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
                // Use evaluate to ensure a clean click operation rather than direct page.click()
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitPasswordBtn");
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error("Submit button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "passwordSubmitted");

                // Wait for successful sign-in (check for both auth status banner and account info)
                // Use a more reliable indicator with longer timeout since authentication can take time
                await page.waitForFunction(
                    () => {
                        // Check auth status banner
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isSignedIn =
                            authStatusBanner &&
                            authStatusBanner.textContent?.includes("Signed in");
                        return isSignedIn;
                    },
                    { timeout: 30000 } // Increase timeout for more reliability
                );
                const tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).toHaveLength(1);
                expect(tokenStore.accessTokens).toHaveLength(1);
                expect(tokenStore.refreshTokens).toHaveLength(1);
                expect(await BrowserCache.getAccountFromCache()).toBeDefined();
                expect(
                    await BrowserCache.accessTokenForScopesExists(
                        tokenStore.accessTokens,
                        ["openid", "profile", "user.read"]
                    )
                ).toBeTruthy();
                await screenshot.takeScreenshot(page, "signInSuccessful");

                // click sign-out button to end the session
                await page.click("#navSignOutBtn");
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
