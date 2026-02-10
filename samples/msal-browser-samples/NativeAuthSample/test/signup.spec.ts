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
    "/signup"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign Up Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let testFirstName: string = "";
    let testLastName: string = "";
    let existingPwdEmail: string = "";
    let emailProviderPwd: string = "";
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
        existingPwdEmail = nativeAuthConfig.signInEmailPasswordUsername;
        emailProviderPwd = nativeAuthConfig.passwordProvider;
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
        testFirstName = "TestFirstName";
        testLastName = "TestLastName";
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

        BrowserCache = new BrowserCacheUtils(page, "sessionStorage");
    });

    afterEach(async () => {
        // Clear storage after each test using shared utility
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    });

    describe("Sign Up Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-up button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button", STANDARD_TIMEOUT);

            // Verify sign-up card and form elements are visible
            await page.waitForSelector("#signUpCard", { visible: true, timeout: STANDARD_TIMEOUT });
        });

        it(
            "User inputs new email and user attributes, verifies code, creates password meeting requirements, completes sign up flow, then automatically sign-in",
            async () => {
                const testName = "signUpSuccessFlow";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Create authenticated email account using factory method
                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Enter user details in the sign-up form
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "signUpButtonClicked");

                // Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: AUTH_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "otpVerificationDisplayed"
                );

                // Read OTP code from authenticated email account
                const otpCode = await emailClient.readOtpCode();

                // Enter and submit OTP code using shared utility with field clearing
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                // Use shared utility for consistent timeout and click behavior
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "otpSubmitted");

                // Wait for password input card (if required)
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                    timeout: AUTH_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter password using config value with shared utility
                await UIInteractionUtils.typeIntoElement(page, "#signUpPassword", nativeAuthConfig.passwordSignInEmailCode, "Password field");
                await screenshot.takeScreenshot(page, "passwordEntered");

                // Submit password using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitSignUpPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "passwordSubmitted");

                // Wait for successful signup completion using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);

                // Verify tokens and authentication using shared utility
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                await screenshot.takeScreenshot(page, "signUpCompleted");
            },
            AUTH_TIMEOUT
        );

        it(
            "User inputs new email, enters incorrect OTP, resends code, verifies correct code, creates password, completes signup with auto sign-in",
            async () => {
                const testName = "signUpSuccessFlowWithResend";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Create authenticated email account using factory method
                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Phase 1: Enter user details and initiate signup
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "1_signUpButtonClicked");

                // Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "2_otpVerificationDisplayed"
                );

                // Phase 2: Enter incorrect OTP and handle error using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", "12345678", "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "3_incorrectOtpEntered");

                // Use shared utility for consistent timeout and click behavior
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
                expect(errorMessage).toContain(
                    "AADSTS50181: Unable to validate the otp"
                );

                // Dismiss error banner using shared utility
                await UIInteractionUtils.clickElementSafely(page, "#dismissErrorBtn", "Dismiss error button");
                await screenshot.takeScreenshot(page, "6_errorDismissed");

                // Phase 3: Resend verification code using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resendCodeBtn", "Resend code button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "7_resendCodeClicked");

                // Wait a moment for resend to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Phase 4: Get new OTP code from already authenticated email client
                const otpCode = await emailClient.readOtpCode();

                // Phase 5: Enter correct OTP and submit using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "8_correctOtpEntered");

                // Submit OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "9_correctOtpSubmitted");

                // Phase 6: Wait for password input card and create password
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "10_passwordInputDisplayed"
                );

                // Enter password using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#signUpPassword", accountPwd, "Password field");
                await screenshot.takeScreenshot(page, "11_passwordEntered");

                // Submit password using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitSignUpPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "12_passwordSubmitted");

                // Phase 7: Wait for successful signup completion using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "13_automaticSignInCompleted"
                );

                // Phase 8: Verify tokens and authentication state using shared utility
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                // Verify user is actually signed in
                const finalAuthStatus = await page.$eval(
                    "#authStatusBanner",
                    (el) => el.textContent
                );
                expect(finalAuthStatus).toContain("Signed in");

                await screenshot.takeScreenshot(page, "14_signUpFlowCompleted");
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign Up Flow - Email + Password - Negative", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-up button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button", STANDARD_TIMEOUT);

            // Verify sign-up card and form elements are visible
            await page.waitForSelector("#signUpCard", { visible: true });
            await page.waitForSelector("#signUpUsername", { visible: true });
            await page.waitForSelector("#signUpBtn", { visible: true });
        });

        it(
            "User inputs invalid format email address, receives email validation error",
            async () => {
                const testName = "signUpWithInvalidEmailFormat";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

                // Use invalid email format - missing TLD as specified
                const invalidEmail = "test-1733090331456-k8x9mq@example";
                // Enter user details in the sign-up form using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", invalidEmail, "Username field");

                // Make sure sign-up button is visible and clickable
                await page.waitForSelector("#signUpBtn", { visible: true });

                // Click sign-up button using shared utility
                await UIInteractionUtils.clickElementSafely(page, "#signUpBtn", "Sign up button");
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "signUpButtonClicked"
                    );
                }

                // Wait for error message to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "errorBannerDisplayed"
                    );
                }

                // Verify error banner content - expect specific AADSTS90100 error for invalid email format
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain(
                    "AADSTS90100: username parameter is empty or not valid"
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "User inputs existing email (registered with email + Password), receives user existed error.",
            async () => {
                const testName = "signUpWithExistingUsername";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

                // Enter username in the sign-up form using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", existingPwdEmail, "Username field");

                // Make sure sign-up button is visible and clickable
                await page.waitForSelector("#signUpBtn", { visible: true });

                // Click sign-up button using shared utility
                await UIInteractionUtils.clickElementSafely(page, "#signUpBtn", "Sign up button");
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "signUpButtonClicked"
                    );
                }

                // Wait for code input card to appear
                await page.waitForSelector("#codeVerificationCard");
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "codeVerificationCardDisplayed"
                    );
                }

                // Wait for error message to appear
                // Wait for the error banner to appear with increased timeout
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "errorBannerDisplayed"
                    );
                }

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain(
                    " Error: user_already_exists: AADSTS1003037"
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "User enters username, attributes to start sign-up flow, and enter the incorrect otp",
            async () => {
                const testName = "signUpWithInvalidOtp";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

                // Use mock email - no real email service needed for negative test
                const signUpEmail = generateMockEmail();

                // Enter user details in the sign-up form using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "signUpButtonClicked"
                    );
                }

                // Wait for code input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "codeVerificationCardDisplayed"
                    );
                }

                // Enter incorrect OTP using shared utility with field clearing
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", "12345678", "OTP verification code field", true);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "verificationCodeEntered"
                    );
                }

                // Submit OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "submitCodeButtonClicked"
                    );
                }

                // Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "errorBannerDisplayed"
                    );
                }

                // Verify error banner content
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain(
                    "AADSTS50181: Unable to validate the otp"
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "User inputs new email, verifies code, creates invalid password (does not meet requirements), receives sign up error",
            async () => {
                const testName = "signUpWithInvalidPassword";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

                // Create authenticated email account using factory method
                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Phase 1: Enter user details and initiate signup using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "1_signUpButtonClicked"
                    );
                }

                // Phase 2: Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "2_otpVerificationDisplayed"
                    );
                }

                // Phase 3: Get OTP code from already authenticated email client
                const otpCode = await emailClient.readOtpCode();

                // Phase 4: Enter correct OTP and submit using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field", true);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "3_correctOtpEntered"
                    );
                }

                // Submit OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "4_otpSubmitted");
                }

                // Phase 5: Wait for password input card to appear
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "5_passwordInputDisplayed"
                    );
                }

                // Phase 6: Enter invalid password using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#signUpPassword", negativeTestData.invalidPassword, "Password field");
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "6_invalidPasswordEntered"
                    );
                }

                // Submit invalid password using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitSignUpPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "7_invalidPasswordSubmitted"
                    );
                }

                // Phase 7: Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "8_passwordErrorBannerDisplayed"
                    );
                }

                // Phase 8: Verify error banner content for password validation
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                // Expect password requirement error message
                expect(errorMessage).toMatch(
                    /(password|requirement|length|complexity|invalid)/i
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "User signs in with existing email, then tries to sign up with same email, receives error to sign out first",
            async () => {
                const testName = "signUpAfterSignInSameUser";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

                // Phase 1: First sign in with existing user
                await page.goto(sampleHomeUrl + `?usePwdConfig=true`);
                await pcaInitializedPoller(page, AUTH_TIMEOUT);

                // Navigate to sign in form using shared utility
                await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button", STANDARD_TIMEOUT);
                await UIInteractionUtils.typeIntoElement(page, "#username", existingPwdEmail, "Username field");
                await UIInteractionUtils.waitAndClick(page, "#signInBtn", "Sign in button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "1_signInInitiated");
                }

                // Enter password for sign in using shared utilities
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT
                });
                await UIInteractionUtils.typeIntoElement(page, "#signInPassword", accountPwd, "Password field");
                await UIInteractionUtils.waitAndClick(page, "#submitPasswordBtn", "Submit password button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "2_signInCompleted");
                }

                // Wait for successful sign-in using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "3_userSignedIn");
                }

                // Phase 2: Now try to sign up with the same email while signed in
                await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button", STANDARD_TIMEOUT);
                await page.waitForSelector("#signUpCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT
                });

                // Fill sign-up form with same user details using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", existingPwdEmail, "Username field"); // Same email
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "4_signUpFormFilled");
                }

                // Submit sign-up form using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "5_signUpAttempted");
                }

                // Phase 3: Verify error message about needing to sign out first
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "6_errorBannerDisplayed"
                    );
                }

                // Verify error banner content - expect message about being already signed in
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toMatch(
                    /(sign out|already signed|logged in|user already signed)/i
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign Up Flow - Email + OTP - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?useOtpConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Wait for sign-up button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button", STANDARD_TIMEOUT);

            // Verify sign-up card and form elements are visible
            await page.waitForSelector("#signUpCard", { visible: true });
            await page.waitForSelector("#signUpUsername", { visible: true });
            await page.waitForSelector("#signUpBtn", { visible: true });
        });

        it(
            "User enters new email and user attributes, verifies code successfully, completes sign up flow, then automatically sign-in",
            async () => {
                const testName = "signUpOtpSuccessful";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Create authenticated email account using factory method
                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Phase 1: Enter user details and initiate signup using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "1_signUpButtonClicked");

                // Phase 2: Wait for OTP verification card (no password step expected)
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "2_otpVerificationDisplayed"
                );

                // Phase 3: Get OTP code from already authenticated email client
                const otpCode = await emailClient.readOtpCode();

                // Phase 4: Enter correct OTP and submit using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "3_correctOtpEntered");

                // Submit OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "4_otpSubmitted");

                // Phase 5: Wait for automatic sign-in using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "5_automaticSignInCompleted"
                );

                // Phase 6: Verify tokens and authentication state using shared utility
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                // Verify user is actually signed in
                const finalAuthStatus = await page.$eval(
                    "#authStatusBanner",
                    (el) => el.textContent
                );
                expect(finalAuthStatus).toContain("Signed in");

                await screenshot.takeScreenshot(page, "6_signUpOtpCompleted");
            },
            AUTH_TIMEOUT
        );

        it(
            "User enters new email and user attributes, uses invalid OTP, requests new code, completes sign up flow, then automatically sign-in",
            async () => {
                const testName = "signUpOtpWithResend";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Create authenticated email account using factory method
                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Phase 1: Enter user details and initiate signup using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", testFirstName, "First name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", testLastName, "Last name field");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "1_signUpButtonClicked");

                // Phase 2: Wait for OTP verification card
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "2_otpVerificationDisplayed"
                );

                // Phase 3: Enter incorrect OTP and handle error using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", negativeTestData.invalidOtpCode, "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "3_incorrectOtpEntered");

                // Submit incorrect OTP using shared utility
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
                expect(errorMessage).toContain(
                    "AADSTS50181: Unable to validate the otp"
                );

                // Dismiss error banner using shared utility
                await UIInteractionUtils.clickElementSafely(page, "#dismissErrorBtn", "Dismiss error button");
                await screenshot.takeScreenshot(page, "6_errorDismissed");

                // Phase 4: Resend verification code using shared utility
                await UIInteractionUtils.waitAndClick(page, "#resendCodeBtn", "Resend code button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "7_resendCodeClicked");

                // Wait a moment for resend to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Phase 5: Get new OTP code from already authenticated email client
                const otpCode = await emailClient.readOtpCode();

                // Phase 6: Enter correct OTP and submit using shared utilities
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode, "OTP verification code field", true);
                await screenshot.takeScreenshot(page, "8_correctOtpEntered");

                // Submit correct OTP using shared utility
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button", STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(page, "9_correctOtpSubmitted");

                // Phase 7: Wait for automatic sign-in completion using shared utility
                await BrowserStateUtils.waitForAuthenticationComplete(page, AUTH_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "10_automaticSignInCompleted"
                );

                // Phase 8: Verify tokens and authentication state using shared utility
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                // Verify user is actually signed in
                const finalAuthStatus = await page.$eval(
                    "#authStatusBanner",
                    (el) => el.textContent
                );
                expect(finalAuthStatus).toContain("Signed in");

                await screenshot.takeScreenshot(
                    page,
                    "11_signUpOtpFlowCompleted"
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign Up Flow - Redirect", () => {
        beforeEach(async () => {
            // Use useRedirectConfig=true to ensure the app initializes with redirect-only challenge types
            await page.goto(
                sampleHomeUrl + `?useOtpConfig=true&useRedirectConfig=true`
            );

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            // Take a screenshot of the initialized state
            if (testConfig.screenshots.enabled) {
                const setupScreenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/setup`
                );
                await setupScreenshot.takeScreenshot(page, "appInitialized");
            }

            // Wait for sign-up button and click it
            await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button", STANDARD_TIMEOUT);

            // Verify sign-up card and form elements are visible
            await page.waitForSelector("#signUpCard", { visible: true });
            await page.waitForSelector("#signUpUsername", { visible: true });
            await page.waitForSelector("#signUpBtn", { visible: true });
        });

        it(
            "User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)",
            async () => {
                const testName = "SignUpOtpWithRedirect";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

                // Use mock email - only testing redirect error behavior, no real email needed
                const testEmail = generateMockEmail();

                // Enter email in the sign-up form using shared utility
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", testEmail, "Username field");

                // Click sign-up button using shared utility
                await UIInteractionUtils.waitAndClick(page, "#signUpBtn", "Sign up button", STANDARD_TIMEOUT);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "signUpButtonClicked"
                    );
                }

                // Wait for the error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "errorBannerDisplayed"
                    );
                }

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

/**
 * Generate a mock email address for testing
 * Returns a unique, realistic email that will pass validation but doesn't require real email service
 * Perfect for negative tests and form validation where no actual email verification is needed
 */
function generateMockEmail(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    return `test-${timestamp}-${randomSuffix}@example.com`;
}
