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
    nativeAuthConfig,
    testData,
} from "./configUtils";

// Use configuration instead of hardcoded values
const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/signup"
);
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
        // Clear storage after each test
        await page.evaluate(() => {
            Object.assign({}, window.sessionStorage.clear());
        });
        await page.evaluate(() => {
            Object.assign({}, window.localStorage.clear());
        });
        await page.close();
    });

    describe("Sign Up Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            // Verify sign-up button is visible on the navigation bar
            const showSignUpBtn = await page.$("#showSignUpBtn");
            expect(showSignUpBtn).toBeTruthy();

            // Click sign-up button on the navigation bar
            await page.click("#showSignUpBtn");

            // Verify sign-up card is visible
            const signUpCard = await page.$("#signUpCard");
            expect(signUpCard).toBeTruthy();

            // Verify sign-up form elements are present
            const usernameInput = await page.$("#signUpUsername");
            const signUpButton = await page.$("#signUpBtn");
            expect(usernameInput).toBeTruthy();
            expect(signUpButton).toBeTruthy();

            // Verify the form is visible
            const isSignUpCardVisible = await page.evaluate(() => {
                const card = document.getElementById("signUpCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isSignUpCardVisible).toBe(true);
        });

        it(
            "User inputs new email and user attributes, verifies code, creates password meeting requirements, completes sign up flow, then automatically sign-in",
            async () => {
                const testName = "signUpSuccessFlow";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Create a new email inbox using password_provider
                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } =
                    await emailClient.createInbox();

                // Enter user details in the sign-up form
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", signUpEmail);

                // Click sign-up button
                await page.waitForSelector("#signUpBtn", { visible: true });
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "signUpButtonClicked");

                // Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "otpVerificationDisplayed"
                );

                // Login to the email account and then get OTP code
                await emailClient.login(signUpEmail, emailProviderPwd);
                const otpCode = await emailClient.readOtpCode();

                // Enter and submit OTP code
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                await screenshot.takeScreenshot(page, "otpCodeEntered");

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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

                // Wait for password input card (if required)
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                    timeout: 35000,
                });
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter password using config value
                await page.waitForSelector("#signUpPassword", {
                    visible: true,
                });
                await page.type(
                    "#signUpPassword",
                    nativeAuthConfig.passwordSignInEmailCode
                );
                await screenshot.takeScreenshot(page, "passwordEntered");

                // Submit password
                await page.waitForSelector("#submitSignUpPasswordBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitSignUpPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "passwordSubmitted");

                // Wait for successful signup completion
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isSignedIn =
                            authStatusBanner &&
                            authStatusBanner.textContent?.includes("Signed in");
                        return isSignedIn;
                    },
                    { timeout: 35000 }
                );

                // Verify tokens and authentication
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

                // Create a new email inbox using password_provider
                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } =
                    await emailClient.createInbox();

                // Phase 1: Enter user details and initiate signup
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", signUpEmail);

                // Click sign-up button
                await page.waitForSelector("#signUpBtn", { visible: true });
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "1_signUpButtonClicked");

                // Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "2_otpVerificationDisplayed"
                );

                // Phase 2: Enter incorrect OTP and handle error
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", "12345678"); // Incorrect OTP
                await screenshot.takeScreenshot(page, "3_incorrectOtpEntered");

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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
                await screenshot.takeScreenshot(
                    page,
                    "4_incorrectOtpSubmitted"
                );

                // Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
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

                // Dismiss error banner
                const dismissBtn = await page.$("#dismissErrorBtn");
                if (dismissBtn) {
                    await page.click("#dismissErrorBtn");
                    await screenshot.takeScreenshot(page, "6_errorDismissed");
                }

                // Phase 3: Resend verification code
                await page.waitForSelector("#resendCodeBtn", { visible: true });
                await page.click("#resendCodeBtn");
                await screenshot.takeScreenshot(page, "7_resendCodeClicked");

                // Wait a moment for resend to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Phase 4: Login to email and get the new OTP code
                await emailClient.login(signUpEmail, emailProviderPwd);
                const otpCode = await emailClient.readOtpCode();

                // Phase 5: Enter correct OTP and submit
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                await screenshot.takeScreenshot(page, "8_correctOtpEntered");

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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
                await screenshot.takeScreenshot(page, "9_correctOtpSubmitted");

                // Phase 6: Wait for password input card and create password
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                    timeout: 35000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "10_passwordInputDisplayed"
                );

                // Enter password meeting requirements using config value
                await page.waitForSelector("#signUpPassword", {
                    visible: true,
                });
                await page.type("#signUpPassword", accountPwd);
                await screenshot.takeScreenshot(page, "11_passwordEntered");

                // Submit password
                await page.waitForSelector("#submitSignUpPasswordBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitSignUpPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "12_passwordSubmitted");

                // Phase 7: Wait for successful signup completion and automatic sign-in
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isSignedIn =
                            authStatusBanner &&
                            authStatusBanner.textContent?.includes("Signed in");
                        return isSignedIn;
                    },
                    { timeout: 35000 }
                );
                await screenshot.takeScreenshot(
                    page,
                    "13_automaticSignInCompleted"
                );

                // Phase 8: Verify tokens and authentication state
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
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            // Verify sign-up button is visible on the navigation bar
            const showSignUpBtn = await page.$("#showSignUpBtn");
            expect(showSignUpBtn).toBeTruthy();

            // Click sign-up button on the navigation bar
            await page.click("#showSignUpBtn");

            // Verify sign-up card is visible
            const signUpCard = await page.$("#signUpCard");
            expect(signUpCard).toBeTruthy();

            // Verify sign-up form elements are present
            const usernameInput = await page.$("#signUpUsername");
            const signUpButton = await page.$("#signUpBtn");
            expect(usernameInput).toBeTruthy();
            expect(signUpButton).toBeTruthy();

            // Verify the form is visible
            const isSignUpCardVisible = await page.evaluate(() => {
                const card = document.getElementById("signUpCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isSignUpCardVisible).toBe(true);
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
                // Enter user details in the sign-up form
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", invalidEmail);

                // Make sure sign-up button is visible and clickable
                await page.waitForSelector("#signUpBtn", { visible: true });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
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

                // Enter username in the sign-up form and click sign-up button
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", existingPwdEmail);

                // Make sure sign-up button is visible and clickable
                await page.waitForSelector("#signUpBtn", { visible: true });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
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

                // Enter user details in the sign-up form
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", signUpEmail);

                // Make sure sign-up button is visible and clickable
                await page.waitForSelector("#signUpBtn", { visible: true });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
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

                // Enter code and submit - ensure code field is fully visible first
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.type("#verificationCode", "12345678"); // Enter incorrect code
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "verificationCodeEntered"
                    );
                }
                await page.click("#submitCodeBtn");
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "submitCodeButtonClicked"
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

                // Create a new email inbox using password_provider
                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } =
                    await emailClient.createInbox();

                // Phase 1: Enter user details and initiate signup
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", signUpEmail);

                // Click sign-up button
                await page.waitForSelector("#signUpBtn", { visible: true });
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "1_signUpButtonClicked"
                    );
                }

                // Phase 2: Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "2_otpVerificationDisplayed"
                    );
                }

                // Phase 3: Login to email and get OTP code
                await emailClient.login(signUpEmail, emailProviderPwd);
                const otpCode = await emailClient.readOtpCode();

                // Phase 4: Enter correct OTP and submit
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "3_correctOtpEntered"
                    );
                }

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "4_otpSubmitted");
                }

                // Phase 5: Wait for password input card to appear
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                    timeout: 35000,
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "5_passwordInputDisplayed"
                    );
                }

                // Phase 6: Enter invalid password (from test data)
                await page.waitForSelector("#signUpPassword", {
                    visible: true,
                });
                await page.type("#signUpPassword", testData.invalidPassword);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "6_invalidPasswordEntered"
                    );
                }

                // Submit invalid password
                await page.waitForSelector("#submitSignUpPasswordBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitSignUpPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit password button not found in the DOM"
                        );
                    }
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "7_invalidPasswordSubmitted"
                    );
                }

                // Phase 7: Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
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

                // Navigate to sign in form
                await page.click("#showSignInBtn");
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", existingPwdEmail);
                await page.click("#signInBtn");
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "1_signInInitiated");
                }

                // Enter password for sign in
                await page.waitForSelector("#passwordInputCard");
                await page.waitForSelector("#signInPassword", {
                    visible: true,
                });
                await page.type("#signInPassword", accountPwd);
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitPasswordBtn");
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error("Submit button not found in the DOM");
                    }
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "2_signInCompleted");
                }

                // Wait for successful sign-in
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isSignedIn =
                            authStatusBanner &&
                            authStatusBanner.textContent?.includes("Signed in");
                        return isSignedIn;
                    },
                    { timeout: 30000 }
                );
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "3_userSignedIn");
                }

                // Phase 2: Now try to sign up with the same email while signed in
                await page.click("#showSignUpBtn");
                await page.waitForSelector("#signUpCard");

                // Fill sign-up form with same user details
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", existingPwdEmail); // Same email
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "4_signUpFormFilled");
                }

                // Submit sign-up form
                await page.waitForSelector("#signUpBtn", { visible: true });
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "5_signUpAttempted");
                }

                // Phase 3: Verify error message about needing to sign out first
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
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

            // Verify sign-up button is visible on the navigation bar
            const showSignUpBtn = await page.$("#showSignUpBtn");
            expect(showSignUpBtn).toBeTruthy();

            // Click sign-up button on the navigation bar
            await page.click("#showSignUpBtn");

            // Verify sign-up card is visible
            const signUpCard = await page.$("#signUpCard");
            expect(signUpCard).toBeTruthy();

            // Verify sign-up form elements are present
            const usernameInput = await page.$("#signUpUsername");
            const signUpButton = await page.$("#signUpBtn");
            expect(usernameInput).toBeTruthy();
            expect(signUpButton).toBeTruthy();

            // Verify the form is visible
            const isSignUpCardVisible = await page.evaluate(() => {
                const card = document.getElementById("signUpCard");
                return card && window.getComputedStyle(card).display !== "none";
            });
            expect(isSignUpCardVisible).toBe(true);
        });

        it(
            "User enters new email and user attributes, verifies code successfully, completes sign up flow, then automatically sign-in",
            async () => {
                const testName = "signUpOtpSuccessful";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Create a new email inbox using password_provider with retry logic
                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } =
                    await emailClient.createInbox();

                // Phase 1: Enter user details and initiate signup
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", signUpEmail);

                // Click sign-up button
                await page.waitForSelector("#signUpBtn", { visible: true });
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "1_signUpButtonClicked");

                // Phase 2: Wait for OTP verification card (no password step expected)
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "2_otpVerificationDisplayed"
                );

                // Phase 3: Login to email and get OTP code
                await emailClient.login(signUpEmail, emailProviderPwd);
                const otpCode = await emailClient.readOtpCode();

                // Phase 4: Enter correct OTP and submit
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                await screenshot.takeScreenshot(page, "3_correctOtpEntered");

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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
                await screenshot.takeScreenshot(page, "4_otpSubmitted");

                // Phase 5: Wait for automatic sign-in (no password step in OTP-only flow)
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isSignedIn =
                            authStatusBanner &&
                            authStatusBanner.textContent?.includes("Signed in");
                        return isSignedIn;
                    },
                    { timeout: 35000 }
                );
                await screenshot.takeScreenshot(
                    page,
                    "5_automaticSignInCompleted"
                );

                // Phase 6: Verify tokens and authentication state
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

                // Create a new email inbox using password_provider with retry logic
                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } = await emailClient.createInbox();

                // Phase 1: Enter user details and initiate signup
                await page.waitForSelector("#signUpFirstName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpLastName", {
                    visible: true,
                });
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });

                await page.type("#signUpFirstName", testFirstName);
                await page.type("#signUpLastName", testLastName);
                await page.type("#signUpUsername", signUpEmail);

                // Click sign-up button
                await page.waitForSelector("#signUpBtn", { visible: true });
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "1_signUpButtonClicked");

                // Phase 2: Wait for OTP verification card
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "2_otpVerificationDisplayed"
                );

                // Phase 3: Enter incorrect OTP and handle error
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", testData.invalidOtpCode); // Incorrect OTP
                await screenshot.takeScreenshot(page, "3_incorrectOtpEntered");

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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
                await screenshot.takeScreenshot(
                    page,
                    "4_incorrectOtpSubmitted"
                );

                // Wait for error banner to appear
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: 15000,
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

                // Dismiss error banner
                const dismissBtn = await page.$("#dismissErrorBtn");
                if (dismissBtn) {
                    await page.click("#dismissErrorBtn");
                    await screenshot.takeScreenshot(page, "6_errorDismissed");
                }

                // Phase 4: Resend verification code
                await page.waitForSelector("#resendCodeBtn", { visible: true });
                await page.click("#resendCodeBtn");
                await screenshot.takeScreenshot(page, "7_resendCodeClicked");

                // Wait a moment for resend to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Phase 5: Login to email and get the new OTP code
                await emailClient.login(signUpEmail, emailProviderPwd);
                const otpCode = await emailClient.readOtpCode();

                // Phase 6: Enter correct OTP and submit
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.click("#verificationCode", { clickCount: 3 });
                await page.type("#verificationCode", otpCode);
                await screenshot.takeScreenshot(page, "8_correctOtpEntered");

                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
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
                await screenshot.takeScreenshot(page, "9_correctOtpSubmitted");

                // Phase 7: Wait for automatic sign-in completion (no password step in OTP-only flow)
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        const isSignedIn =
                            authStatusBanner &&
                            authStatusBanner.textContent?.includes("Signed in");
                        return isSignedIn;
                    },
                    { timeout: 35000 }
                );
                await screenshot.takeScreenshot(
                    page,
                    "10_automaticSignInCompleted"
                );

                // Phase 8: Verify tokens and authentication state
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

            // Wait for the application to initialize with a longer timeout
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability

            // Verify that no user signed in initially
            const authStatusBanner = await page.$eval(
                "#authStatusBanner",
                (el) => el.textContent
            );
            expect(authStatusBanner).toContain("No user signed in");

            // Take a screenshot of the initialized state
            if (testConfig.screenshots.enabled) {
                const setupScreenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/setup`
                );
                await setupScreenshot.takeScreenshot(page, "appInitialized");
            }

            // Verify sign-up button is visible on the navigation bar
            const showSignUpBtn = await page.$("#showSignUpBtn");
            expect(showSignUpBtn).toBeTruthy();

            // Click sign-up button on the navigation bar
            await page.click("#showSignUpBtn");

            // Verify sign-up card is visible
            const signUpCard = await page.$("#signUpCard");
            expect(signUpCard).toBeTruthy();

            // Verify sign-up form elements are present
            const usernameInput = await page.$("#signUpUsername");
            const signUpButton = await page.$("#signUpBtn");
            expect(usernameInput).toBeTruthy();
            expect(signUpButton).toBeTruthy();
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
                // Enter email in the sign-up form and click sign-up button
                await page.waitForSelector("#signUpUsername", {
                    visible: true,
                });
                await page.type("#signUpUsername", testEmail);

                // Make sure sign-up button is visible and clickable
                await page.waitForSelector("#signUpBtn", { visible: true });

                // Use evaluate to click to avoid potential click issues
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "signUpButtonClicked"
                    );
                }

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
