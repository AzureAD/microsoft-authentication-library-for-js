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
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import path = require("path");
import { startCorsProxy, stopCorsProxy } from "./utils/proxyUtils";
import { MailTmClient } from "./utils/emailProviderUtils";
import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    negativeTestData,
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
    "/signin"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const EXTENDED_TIMEOUT = testConfig.timeouts.extended;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign In Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let corsProcess: ChildProcess;
    let emailOtpClient: MailTmClient;
    let signInEmailUsername: string = "";
    let signInEmailOtpUsername: string = "";
    let accountPwd: string = "";
    let emailProviderPwd: string = "";

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

        // Set up email usernames from configuration for reuse across all tests
        signInEmailUsername = nativeAuthConfig.signInEmailPasswordUsername;
        signInEmailOtpUsername = nativeAuthConfig.signInEmailCodeUsername;
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
        emailProviderPwd = nativeAuthConfig.passwordProvider;
    });

    afterAll(async () => {
        await context?.close();
        await browser?.close();
        // Stop the CORS proxy server using the utility function
        stopCorsProxy(corsProcess);
    });

    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();

        BrowserCache = new BrowserCacheUtils(
            page,
            "sessionStorage" // Based on Native Auth Sample configuration
        );
    });

    afterEach(async () => {
        // Clear storage after each test using shared utility
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    });

    describe("Sign In Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-in button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button", STANDARD_TIMEOUT);

            // Verify sign-in card is visible
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "User inputs registered email and password, signs in successfully",
            async () => {
                const testName = "signInFormDisplay";
                let screenshot: Screenshot | undefined;
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailUsername, "Username field");

                // Wait for sign-in button and click it
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "signInButtonClicked"
                );

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard");
                await screenshot.takeScreenshot(
                    page,
                    "passwordInputDisplayed"
                );

                // Enter password and submit
                await UIInteractionUtils.typeIntoElement(page, "#signInPassword", accountPwd, "Password field");
                await screenshot.takeScreenshot(
                    page,
                    "passwordInputEntered"
                );

                // Wait for submit button and click it
                await UIInteractionUtils.waitAndClick(page, "#submitPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "passwordSubmitted");

                // Wait for successful sign-in
                await BrowserStateUtils.waitForAuthenticationComplete(page, STANDARD_TIMEOUT);
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);
                await screenshot.takeScreenshot(page, "signInSuccessful");
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + Password - Negative", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-in button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button", STANDARD_TIMEOUT);

            // Verify sign-in card and form elements are visible
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "User inputs non-registered email, receives account not found error",
            async () => {
                const testName = "signInWithNonRegisteredUsername";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                const nonRegisteredEmail = negativeTestData.nonRegisteredEmail;
                await UIInteractionUtils.typeIntoElement(page, "#username", nonRegisteredEmail, "Username field");
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("Error: user_not_found");

                // Verify that the user is still not signed in
                await BrowserStateUtils.verifyNotSignedIn(page);
                await TokenVerificationUtils.verifyNoTokensInCache(BrowserCache);
            },
            AUTH_TIMEOUT
        );

        it(
            "User inputs registered email, provides incorrect password, receives error",
            async () => {
                const testName = "signInWithIncorrectPassword";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailUsername, "Username field");
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard");
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter incorrect password and submit
                await UIInteractionUtils.typeIntoElement(page, "#signInPassword", negativeTestData.incorrectPassword, "Password field");
                await screenshot.takeScreenshot(
                    page,
                    "incorrectPasswordEntered"
                );

                // Wait for submit button and click it
                await UIInteractionUtils.waitAndClick(page, "#submitPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "incorrectPasswordSubmitted"
                );

                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("AADSTS50126");

                // Verify that the user is still not signed in
                await BrowserStateUtils.verifyNotSignedIn(page);
                await TokenVerificationUtils.verifyNoTokensInCache(BrowserCache);
            },
            AUTH_TIMEOUT
        );

        it(
            "User signs in with account A when account A has already signed in",
            async () => {
                const testName = "signInFormErrorWithSameAccount";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailUsername, "Username field");

                // Wait for sign-in button and click it
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard");
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter password and submit
                await UIInteractionUtils.typeIntoElement(page, "#signInPassword", accountPwd, "Password field");
                await screenshot.takeScreenshot(page, "passwordInputEntered");

                // Wait for submit button and click it
                await UIInteractionUtils.waitAndClick(page, "#submitPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "passwordSubmitted");

                // Wait for successful sign-in
                await BrowserStateUtils.waitForAuthenticationComplete(page, STANDARD_TIMEOUT);
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                // Now sign in with same account
                // Click sign-in button again
                await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button", STANDARD_TIMEOUT);
                // Verify sign-in card is visible
                await page.waitForSelector("#signInCard", { visible: true });
                // Enter account username in the sign-in form
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailUsername, "Username field");
                // Wait for sign-in button and click it
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain(
                    "Error: user_already_signed_in:"
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + OTP - Positive", () => {
        beforeAll(async () => {
            // Initialize email client for OTP account
            emailOtpClient = await MailTmClient.connectToExistingAccount(
                signInEmailOtpUsername,
                emailProviderPwd
            );
        });

        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?useOtpConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-in button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button", STANDARD_TIMEOUT);

            // Verify sign-in card and form elements are visible
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "User inputs registered email, then receives OTP, verifies successfully",
            async () => {
                const testName = "emailOtpSignInSuccessful";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter email in the sign-in form and click sign-in button
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailOtpUsername, "Username field");
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");

                // Get OTP code from email
                const otpCode = await emailOtpClient.readOtpCode();

                // Enter OTP and submit
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field");
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                // Submit the OTP code
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "otpSubmitted");

                // Wait for successful sign-in
                await BrowserStateUtils.waitForAuthenticationComplete(page, STANDARD_TIMEOUT);

                // Verify tokens and authentication
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);
                await screenshot.takeScreenshot(page, "signInSuccessful");
            },
            AUTH_TIMEOUT
        );

        it(
            "User inputs registered email, enters incorrect OTP code, requests new OTP, enters valid code, signs in successfully",
            async () => {
                const testName = "emailOtpSignInWithRetry";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Phase 1: Enter email and initiate sign-in
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailOtpUsername, "Username field");
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "1_signInButtonClicked");

                // Phase 2: Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(page, "2_otpInputDisplayed");

                // Phase 3: Enter incorrect OTP and handle error
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", "12345678", "OTP verification code field"); // Incorrect OTP
                await screenshot.takeScreenshot(page, "3_incorrectOtpEntered");

                // Submit incorrect OTP
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "4_incorrectOtpSubmitted"
                );

                // Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "5_errorBannerDisplayed");

                // Verify error message
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("Sign-in Error:");

                // Dismiss error banner
                const dismissBtn = await page.$("#dismissErrorBtn");
                if (dismissBtn) {
                    await UIInteractionUtils.waitAndClick(page, "#dismissErrorBtn", "Dismiss error button", STANDARD_TIMEOUT);
                    await screenshot.takeScreenshot(page, "6_errorDismissed");
                }

                // Phase 4: Resend OTP code
                await UIInteractionUtils.waitAndClick(page, "#resendCodeBtn", "Resend code button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "7_resendCodeClicked");

                // Wait a moment for resend to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Phase 5: Get new OTP code from email
                const otpCode = await emailOtpClient.readOtpCode();

                // Phase 6: Enter correct OTP and submit
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "8_correctOtpEntered");

                // Submit correct OTP
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", EXTENDED_TIMEOUT);
                await screenshot.takeScreenshot(page, "9_correctOtpSubmitted");

                // Phase 7: Wait for successful sign-in
                await BrowserStateUtils.waitForAuthenticationComplete(page, STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "10_signInSuccessful");

                // Phase 8: Verify tokens and authentication state
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                await screenshot.takeScreenshot(page, "11_signInFlowCompleted");
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + OTP Redirect", () => {
        beforeEach(async () => {
            // Use useRedirectConfig=true to ensure the app initializes with redirect-only challenge types
            await page.goto(
                sampleHomeUrl + `?useOtpConfig=true&useRedirectConfig=true`
            );
            // Wait for the application to initialize with a longer timeout
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Take a screenshot of the initialized state
            const setupScreenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/setup`
            );
            await setupScreenshot.takeScreenshot(page, "appInitialized");

            // Wait for sign-in button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button", STANDARD_TIMEOUT);

            // Verify sign-in card and form elements are visible
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)",
            async () => {
                const testName = "emailOtpSignInRedirect";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter email in the sign-in form and click sign-in button
                await UIInteractionUtils.typeIntoElement(page, "#username", signInEmailOtpUsername, "Username field");
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("redirect");
            },
            AUTH_TIMEOUT
        );
    });
});
