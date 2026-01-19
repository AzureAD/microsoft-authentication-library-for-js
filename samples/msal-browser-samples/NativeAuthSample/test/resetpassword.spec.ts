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
import { startCorsProxy, stopCorsProxy } from "./proxyUtils";
import { MailTmClient } from "./emailProviderUtils";

import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    getTestUsers,
    getTestData,
    nativeAuthConfig,
    testData,
} from "./configUtils";

// Use configuration instead of hardcoded values
const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/resetpassword"
);
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

        // Initialize email client for reset password account
        resetPasswordClient = new MailTmClient();
        await resetPasswordClient.login(
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
        // Clear storage after each test
        await page.evaluate(() => {
            Object.assign({}, window.sessionStorage.clear());
        });
        await page.evaluate(() => {
            Object.assign({}, window.localStorage.clear());
        });
        await page.close();
    });

    describe("Reset Password Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            // Verify reset password button is visible on the navigation bar
            const showResetPasswordButton = await page.$(
                "#showResetPasswordBtn"
            );
            expect(showResetPasswordButton).toBeTruthy();

            // Click reset password button on the navigation bar
            await page.click("#showResetPasswordBtn");

            // Verify reset password card is visible
            const resetPasswordCard = await page.$("#resetPasswordCard");
            expect(resetPasswordCard).toBeTruthy();

            // Verify reset password form elements are present
            const resetPasswordEmailInput = await page.$("#resetPasswordEmail");
            const resetPasswordButton = await page.$("#resetPasswordBtn");
            expect(resetPasswordEmailInput).toBeTruthy();
            expect(resetPasswordButton).toBeTruthy();

            // Verify the form is visible
            const isResetPasswordCardVisible = await page.evaluate(() => {
                const card = document.getElementById("resetPasswordCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isResetPasswordCardVisible).toBe(true);
        });

        it(
            "User requests reset inputs emails, receives code, sets new valid password, completes reset, auto-signs in",
            async () => {
                const testName = "resetPasswordSuccessfulFlow";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter reset password email and click reset button
                await page.waitForSelector("#resetPasswordEmail", {
                    visible: true,
                });
                await page.type("#resetPasswordEmail", resetPasswordUsername);

                // Make sure reset password button is visible and clickable
                await page.waitForSelector("#resetPasswordBtn", {
                    visible: true,
                });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const resetButton =
                        document.getElementById("resetPasswordBtn");
                    if (resetButton) {
                        resetButton.click();
                    } else {
                        throw new Error(
                            "Reset password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");

                // Get OTP code from email
                const otpCode = await resetPasswordClient.readOtpCode();
                // Enter OTP and submit - ensure OTP field is fully visible first
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });

                // Clear any existing content and type the OTP code
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                // Wait for the submit button to be visible and enabled
                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });

                // Submit the OTP code
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitCodeBtn");
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit OTP button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "otpSubmitted");

                // Wait for new password input card to appear
                await page.waitForSelector("#resetPasswordNewPasswordCard", {
                    visible: true,
                    timeout: 40000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "newPasswordInputDisplayed"
                );

                // Enter new password
                await page.waitForSelector("#resetPasswordNewPassword", {
                    visible: true,
                });
                await page.type(
                    "#resetPasswordNewPassword",
                    nativeAuthConfig.passwordSignInEmailCode
                );
                await screenshot.takeScreenshot(page, "newPasswordEntered");

                // Submit new password
                await page.waitForSelector(
                    "#submitResetPasswordNewPasswordBtn:enabled",
                    {
                        visible: true,
                        timeout: 15000,
                    }
                );

                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitResetPasswordNewPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit new password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "newPasswordSubmitted");

                // Wait for successful completion
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isCompleted =
                            authStatusBanner &&
                            (authStatusBanner.textContent?.includes(
                                "Password reset completed"
                            ) ||
                                authStatusBanner.textContent?.includes(
                                    "Signed in"
                                ));
                        return isCompleted;
                    },
                    { timeout: 35000 }
                );

                const tokenStore = await BrowserCache.getTokens();
                expect(tokenStore.idTokens).toHaveLength(1);
                expect(tokenStore.accessTokens).toHaveLength(1);
                expect(tokenStore.refreshTokens).toHaveLength(1);
                expect(
                    await BrowserCache.getAccountFromCache()
                ).toBeDefined();
                expect(
                    await BrowserCache.accessTokenForScopesExists(
                        tokenStore.accessTokens,
                        ["openid", "profile", "user.read"]
                    )
                ).toBeTruthy();

                if (screenshot) {
                    await screenshot.takeScreenshot(page, "resetPasswordCompleted");
                }
            },
            AUTH_TIMEOUT
        );
    });

    describe("Reset Password Flow - Email + Password - Negative", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            // Verify reset password button is visible on the navigation bar
            const showResetPasswordButton = await page.$(
                "#showResetPasswordBtn"
            );
            expect(showResetPasswordButton).toBeTruthy();

            // Click reset password button on the navigation bar
            await page.click("#showResetPasswordBtn");

            // Verify reset password card is visible
            const resetPasswordCard = await page.$("#resetPasswordCard");
            expect(resetPasswordCard).toBeTruthy();

            // Verify reset password form elements are present
            const resetPasswordEmailInput = await page.$("#resetPasswordEmail");
            const resetPasswordButton = await page.$("#resetPasswordBtn");
            expect(resetPasswordEmailInput).toBeTruthy();
            expect(resetPasswordButton).toBeTruthy();

            // Verify the form is visible
            const isResetPasswordCardVisible = await page.evaluate(() => {
                const card = document.getElementById("resetPasswordCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isResetPasswordCardVisible).toBe(true);
        });

        it(
            "User submits non-existing email, receives account not found error",
            async () => {
                const testName = "resetPasswordWithNonExistingUsername";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the reset password form and click reset password button
                await page.waitForSelector("#resetPasswordEmail", {
                    visible: true,
                });
                await page.type(
                    "#resetPasswordEmail",
                    "non-existemail@test.com"
                );

                // Make sure reset password button is visible and clickable
                await page.waitForSelector("#resetPasswordBtn", {
                    visible: true,
                });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const resetPasswordButton =
                        document.getElementById("resetPasswordBtn");
                    if (resetPasswordButton) {
                        resetPasswordButton.click();
                    } else {
                        throw new Error(
                            "Reset Password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for error message to appear
                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 20000,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("");
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

                // Enter username in the reset password form and click reset password button
                await page.waitForSelector("#resetPasswordEmail", {
                    visible: true,
                });
                await page.type(
                    "#resetPasswordEmail",
                    resetPasswordEmailWithOtp
                );

                // Make sure reset password button is visible and clickable
                await page.waitForSelector("#resetPasswordBtn", {
                    visible: true,
                });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const resetPasswordButton =
                        document.getElementById("resetPasswordBtn");
                    if (resetPasswordButton) {
                        resetPasswordButton.click();
                    } else {
                        throw new Error(
                            "Reset Password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for error message to appear
                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("");
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

                // Enter username in the reset password form and click reset password button
                await page.waitForSelector("#resetPasswordEmail", {
                    visible: true,
                });
                await page.type("#resetPasswordEmail", resetPasswordUsername);
                // Make sure reset password button is visible and clickable
                await page.waitForSelector("#resetPasswordBtn", {
                    visible: true,
                });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const resetPasswordButton =
                        document.getElementById("resetPasswordBtn");
                    if (resetPasswordButton) {
                        resetPasswordButton.click();
                    } else {
                        throw new Error("Sign in button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for code input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(page, "codeVerificationCard");

                // Enter code and submit - ensure code field is fully visible first
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.type("#verificationCode", "12345678"); // Enter incorrect code
                await screenshot.takeScreenshot(
                    page,
                    "verificationCodeEntered"
                );
                await page.click("#submitCodeBtn");
                await screenshot.takeScreenshot(
                    page,
                    "submitCodeButtonClicked"
                );

                // Wait for error message to appear
                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
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

                // Enter reset password email and click reset button
                await page.waitForSelector("#resetPasswordEmail", {
                    visible: true,
                });
                await page.type("#resetPasswordEmail", resetPasswordUsername);

                // Make sure reset password button is visible and clickable
                await page.waitForSelector("#resetPasswordBtn", {
                    visible: true,
                });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const resetButton =
                        document.getElementById("resetPasswordBtn");
                    if (resetButton) {
                        resetButton.click();
                    } else {
                        throw new Error(
                            "Reset password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");

                // Get OTP code from email
                const otpCode = await resetPasswordClient.readOtpCode();
                // Enter OTP and submit - ensure OTP field is fully visible first
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });

                // Clear any existing content and type the OTP code
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                // Wait for the submit button to be visible and enabled
                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });

                // Submit the OTP code
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitCodeBtn");
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit OTP button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "otpSubmitted");

                // Wait for new password input card to appear
                await page.waitForSelector("#resetPasswordNewPasswordCard", {
                    visible: true,
                    timeout: 35000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "newPasswordInputDisplayed"
                );

                // Enter a weak password that doesn't meet complexity requirements
                await page.waitForSelector("#resetPasswordNewPassword", {
                    visible: true,
                });
                await page.type(
                    "#resetPasswordNewPassword",
                    testData.invalidPassword
                );
                await screenshot.takeScreenshot(page, "weakPasswordEntered");

                // Submit weak password
                await page.waitForSelector(
                    "#submitResetPasswordNewPasswordBtn:enabled",
                    {
                        visible: true,
                        timeout: 15000,
                    }
                );

                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitResetPasswordNewPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit new password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "weakPasswordSubmitted");

                // Wait for the error banner to appear with password complexity requirements
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 20000,
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

                // Verify we're still on the new password input form
                const newPasswordCard = await page.$(
                    "#resetPasswordNewPasswordCard"
                );
                expect(newPasswordCard).toBeTruthy();

                const isVisible = await page.evaluate(() => {
                    const card = document.getElementById(
                        "resetPasswordNewPasswordCard"
                    );
                    return (
                        card && window.getComputedStyle(card).display !== "none"
                    );
                });
                expect(isVisible).toBe(true);

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

            // Wait for the application to initialize with a longer timeout
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability

            // Verify reset password button is visible on the navigation bar
            const showResetPasswordButton = await page.$(
                "#showResetPasswordBtn"
            );
            expect(showResetPasswordButton).toBeTruthy();

            // Click reset password button on the navigation bar
            await page.click("#showResetPasswordBtn");

            // Verify reset password card is visible
            const resetPasswordCard = await page.$("#resetPasswordCard");
            expect(resetPasswordCard).toBeTruthy();

            // Verify reset password form elements are present
            const resetPasswordEmailInput = await page.$("#resetPasswordEmail");
            const resetPasswordButton = await page.$("#resetPasswordBtn");
            expect(resetPasswordEmailInput).toBeTruthy();
            expect(resetPasswordButton).toBeTruthy();

            // Verify the form is visible
            const isResetPasswordCardVisible = await page.evaluate(() => {
                const card = document.getElementById("resetPasswordCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isResetPasswordCardVisible).toBe(true);
        });

        it(
            "User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)",
            async () => {
                const testName = "resetPasswordRedirect";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the reset password form and click reset password button
                await page.waitForSelector("#resetPasswordEmail", {
                    visible: true,
                });
                await page.type(
                    "#resetPasswordEmail",
                    resetPasswordEmailWithOtp
                );

                // Make sure reset password button is visible and clickable
                await page.waitForSelector("#resetPasswordBtn", {
                    visible: true,
                });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const resetPasswordButton =
                        document.getElementById("resetPasswordBtn");
                    if (resetPasswordButton) {
                        resetPasswordButton.click();
                    } else {
                        throw new Error(
                            "Reset Password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "resetPasswordButtonClicked"
                );

                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
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
