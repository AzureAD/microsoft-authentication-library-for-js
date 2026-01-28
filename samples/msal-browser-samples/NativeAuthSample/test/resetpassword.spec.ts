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
    nativeAuthConfig,
    negativeTestData,
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
    "/resetpassword"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const EXTENDED_TIMEOUT = testConfig.timeouts.extended;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

describe("Native Auth Sample - Reset Password Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let resetPasswordEmailWithOtp: string = "";
    let resetPasswordUsername: string = "";
    let emailProviderPwd: string = "";
    let corsProcess: ChildProcess;
    let resetPasswordClient: MailTmClient;

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
        resetPasswordUsername = nativeAuthConfig.resetPasswordUsername;
        resetPasswordEmailWithOtp = nativeAuthConfig.signInEmailCodeUsername;
        emailProviderPwd = nativeAuthConfig.passwordProvider;

        // Initialize email client for reset password account using factory method
        resetPasswordClient = await MailTmClient.connectToExistingAccount(
            resetPasswordUsername,
            emailProviderPwd
        );
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
        ); // Navigate to the Native Auth Sample home page and wait for network idle to ensure full page load
    });

    afterEach(async () => {
        // Clear storage after each test using shared utility
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    });

    describe("Reset Password Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for reset password button and click it
            await UIInteractionUtils.waitAndClick(page, "#showResetPasswordBtn", "Show reset password button", STANDARD_TIMEOUT);

            // Verify reset password card and form elements are visible
            await page.waitForSelector("#resetPasswordCard", { visible: true, timeout: STANDARD_TIMEOUT });
        });

        it(
            "User requests reset inputs emails, receives code, sets new valid password, completes reset, auto-signs in",
            async () => {
                const testName = "resetPasswordSuccessfulFlow";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Mark checkpoint before triggering OTP for existing email account
                resetPasswordClient.markCheckpoint();

                // Enter reset password email and click reset button
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordEmail", resetPasswordUsername, "Reset password email field");

                // Click reset password button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resetPasswordBtn", "Reset password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");

                // Get OTP code from email
                const otpCode = await resetPasswordClient.readOtpCode();

                // Enter OTP using shared utility with proper field clearing
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification field", true);
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                // Submit OTP code using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "otpSubmitted");

                // Wait for new password input card to appear
                await page.waitForSelector("#resetPasswordNewPasswordCard", {
                    visible: true,
                    timeout: EXTENDED_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "newPasswordInputDisplayed"
                );

                // Enter new password using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordNewPassword", nativeAuthConfig.passwordSignInEmailCode, "New password field");
                await screenshot.takeScreenshot(page, "newPasswordEntered");

                // Submit new password using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitResetPasswordNewPasswordBtn", "Submit new password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "newPasswordSubmitted");

                // Wait for successful completion using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);

                // Verify tokens and authentication using shared utility
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                await screenshot.takeScreenshot(page, "resetPasswordCompleted");
            },
            AUTH_TIMEOUT
        );
    });

    describe("Reset Password Flow - Email + Password - Negative", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for reset password button and click it
            await UIInteractionUtils.waitAndClick(page, "#showResetPasswordBtn", "Show reset password button", STANDARD_TIMEOUT);

            // Verify reset password card and form elements are visible
            await page.waitForSelector("#resetPasswordCard", { visible: true, timeout: STANDARD_TIMEOUT });
        });

        it(
            "User submits non-existing email, receives account not found error",
            async () => {
                const testName = "resetPasswordWithNonExistingUsername";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter non-existing email using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordEmail", "non-existemail@test.com", "Reset password email field");

                // Click reset password button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resetPasswordBtn", "Reset password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for error banner to appear
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
                expect(errorMessage).toContain("user_not_found");
            },
            AUTH_TIMEOUT
        );

        it(
            "User submits existing email, but email does not linked to any password (registered as email + OTP)",
            async () => {
                const testName = "resetPasswordWithOtpUsername";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter OTP username using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordEmail", resetPasswordEmailWithOtp, "Reset password email field");

                // Click reset password button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resetPasswordBtn", "Reset password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for error banner to appear
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
                expect(errorMessage).toContain("does not support native credential recovery");
            },
            AUTH_TIMEOUT
        );

        it(
            "User submits existing email, and submit incorrect code",
            async () => {
                const testName = "resetPasswordWithIncorrectOtp";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Mark checkpoint before triggering OTP for existing email account
                resetPasswordClient.markCheckpoint();

                // Enter reset password email using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordEmail", resetPasswordUsername, "Reset password email field");

                // Click reset password button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resetPasswordBtn", "Reset password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for code input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "codeVerificationCard");

                // Enter incorrect OTP using shared utility with field clearing
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", "12345678", "OTP verification field", true);
                await screenshot.takeScreenshot(
                    page,
                    "verificationCodeEntered"
                );

                // Submit incorrect OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "submitCodeButtonClicked"
                );

                // Wait for error banner to appear
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
                    "Error: invalid_grant: AADSTS50181: Unable to validate the otp"
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "User submits existing email, receives code, creates invalid password (doesn't meet password complexity requirements), receives requirements error",
            async () => {
                const testName = "resetPasswordComplexityError";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Mark checkpoint before triggering OTP for existing email account
                resetPasswordClient.markCheckpoint();

                // Enter reset password email using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordEmail", resetPasswordUsername, "Reset password email field");

                // Click reset password button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resetPasswordBtn", "Reset password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");

                // Get OTP code from email
                const otpCode = await resetPasswordClient.readOtpCode();

                // Enter OTP using shared utility with field clearing
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification field", true);
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                // Submit OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "otpSubmitted");

                // Wait for new password input card to appear
                await page.waitForSelector("#resetPasswordNewPasswordCard", {
                    visible: true,
                    timeout: EXTENDED_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "newPasswordInputDisplayed"
                );

                // Enter weak password using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordNewPassword", negativeTestData.invalidPassword, "New password field");
                await screenshot.takeScreenshot(page, "weakPasswordEntered");

                // Submit weak password using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitResetPasswordNewPasswordBtn", "Submit new password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "weakPasswordSubmitted");

                // Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "passwordComplexityErrorDisplayed"
                );

                // Verify error banner content contains password complexity requirements
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("password"); // Should contain password-related error
                await screenshot.takeScreenshot(page, "testCompleted");
            },
            AUTH_TIMEOUT
        );
    });

    describe("Reset Password Flow - Redirect", () => {
        beforeEach(async () => {
            // Use useRedirectConfig=true to ensure the app initializes with redirect-only challenge types
            await page.goto(
                sampleHomeUrl + `?usePwdConfig=true&useRedirectConfig=true`
            );

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for reset password button and click it
            await UIInteractionUtils.waitAndClick(page, "#showResetPasswordBtn", "Show reset password button", STANDARD_TIMEOUT);

            // Verify reset password card and form elements are visible
            await page.waitForSelector("#resetPasswordCard", { visible: true, timeout: STANDARD_TIMEOUT });
            await page.waitForSelector("#resetPasswordEmail", { visible: true, timeout: STANDARD_TIMEOUT });
            await page.waitForSelector("#resetPasswordBtn", { visible: true, timeout: STANDARD_TIMEOUT });
        });

        it(
            "User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)",
            async () => {
                const testName = "resetPasswordRedirect";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter OTP email using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#resetPasswordEmail", resetPasswordEmailWithOtp, "Reset password email field");

                // Click reset password button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resetPasswordBtn", "Reset password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for error banner to appear
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
                    "invalid_request: AADSTS500222: The tenant or user does not support native credential recovery"
                );
            },
            AUTH_TIMEOUT
        );
    });
});
