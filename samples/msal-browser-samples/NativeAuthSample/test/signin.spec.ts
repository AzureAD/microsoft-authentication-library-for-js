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
} from "./configUtils";

// Use configuration instead of hardcoded values
const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/signin"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
const TEST_TIMEOUT = testConfig.timeouts.test;
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign In Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let signInEmailUsername: string = "";
    let accountPwd: string = "";
    let signInEmailOtpUsername: string = "";
    let emailProviderPwd: string = "";
    let corsProcess: ChildProcess;
    let invalidTestUsers: any; // Store test data for all tests
    let emailOtpClient: MailTmClient;

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

        // Fetch test data once for all tests
        invalidTestUsers = getTestData();
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
        // // Clear storage after each test
        await page.evaluate(() => {
            Object.assign({}, window.sessionStorage.clear());
        });
        await page.evaluate(() => {
            Object.assign({}, window.localStorage.clear());
        });
        await page.close();
    });

    describe("Sign In Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

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
            "User inputs registered email and password, signs in successfully",
            async () => {
                const testName = "signInFormDisplay";
                let screenshot: Screenshot | undefined;

                if (testConfig.screenshots.enabled) {
                    screenshot = new Screenshot(
                        `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                    );
                }

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
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "signInButtonClicked"
                    );
                }

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard");
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "passwordInputDisplayed"
                    );
                }

                // Enter password and submit - ensure password field is fully visible first
                await page.waitForSelector("#signInPassword", {
                    visible: true,
                });
                await page.type("#signInPassword", accountPwd);
                if (screenshot) {
                    await screenshot.takeScreenshot(
                        page,
                        "passwordInputEntered"
                    );
                }

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
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "passwordSubmitted");
                }

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
                if (screenshot) {
                    await screenshot.takeScreenshot(page, "signInSuccessful");
                }
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
            "User inputs non-registered email, receives account not found error",
            async () => {
                const testName = "signInWithNonRegisteredUsername";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                const nonRegisteredEmail = invalidTestUsers.nonRegisteredEmail;
                await page.type("#username", nonRegisteredEmail);
                await page.click("#signInBtn");
                await screenshot.takeScreenshot(page, "signInButtonClicked");

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
                expect(errorMessage).toContain("Error: user_not_found");

                // Verify that the user is still not signed in
                const authStatusBanner = await page.$eval(
                    "#authStatusBanner",
                    (el) => el.textContent
                );
                expect(authStatusBanner).toContain("No user signed in");
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
                await page.type("#username", signInEmailUsername);
                await page.click("#signInBtn");
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard");
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter incorrect password and submit
                await page.waitForSelector("#signInPassword", {
                    visible: true,
                });
                await page.type(
                    "#signInPassword",
                    invalidTestUsers.incorrectPassword
                );
                await screenshot.takeScreenshot(
                    page,
                    "incorrectPasswordEntered"
                );

                // Wait for the submit button to be visible and enabled
                await page.waitForSelector("#submitPasswordBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
                await page.click("#submitPasswordBtn");
                await screenshot.takeScreenshot(
                    page,
                    "incorrectPasswordSubmitted"
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
                expect(errorMessage).toContain("Sign-in Error:");

                // Verify that the user is still not signed in
                const authStatusBanner = await page.$eval(
                    "#authStatusBanner",
                    (el) => el.textContent
                );
                expect(authStatusBanner).toContain("No user signed in");

                // Verify we're still on the password input form
                const passwordInputCard = await page.$("#passwordInputCard");
                expect(passwordInputCard).toBeTruthy();

                const isVisible = await page.evaluate(() => {
                    const card = document.getElementById("passwordInputCard");
                    return (
                        card && window.getComputedStyle(card).display !== "none"
                    );
                });
                expect(isVisible).toBe(true);

                // Try dismissing the error banner
                await page.click("#dismissErrorBtn");

                // Verify error banner is hidden
                const errorBannerVisible = await page.evaluate(() => {
                    const banner = document.getElementById("errorBanner");
                    return banner
                        ? window.getComputedStyle(banner).display !== "none"
                        : false;
                });
                expect(errorBannerVisible).toBe(false);
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
                await page.waitForSelector("#passwordInputCard");
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter password and submit - ensure password field is fully visible first
                await page.waitForSelector("#signInPassword", {
                    visible: true,
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

                // Now sign in with same account
                // Click sign-in button again
                await page.click("#showSignInBtn");
                // Verify sign-in card is visible
                const signInCard = await page.$("#signInCard");
                expect(signInCard).toBeTruthy();
                // Enter account B username in the sign-in form
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailUsername); // Using account B email
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
                    "Error: user_already_signed_in:"
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + OTP - Positive", () => {
        beforeAll(async () => {
            // Initialize email client for OTP account
            emailOtpClient = new MailTmClient();
            await emailOtpClient.login(
                signInEmailOtpUsername,
                emailProviderPwd
            );
        });

        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?useOtpConfig=true`);

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
            "User inputs registered email, then receives OTP, verifies successfully",
            async () => {
                const testName = "emailOtpSignInSuccessful";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter email in the sign-in form and click sign-in button
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailOtpUsername);

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

                // Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");

                // Get OTP code from email
                const otpCode = await emailOtpClient.readOtpCode();

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
                    { timeout: 40000 }
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
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailOtpUsername);

                await page.waitForSelector("#signInBtn", { visible: true });
                await page.evaluate(() => {
                    const signInButton = document.getElementById("signInBtn");
                    if (signInButton) {
                        signInButton.click();
                    } else {
                        throw new Error("Sign in button not found in the DOM");
                    }
                });
                await screenshot.takeScreenshot(page, "1_signInButtonClicked");

                // Phase 2: Wait for OTP input card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(page, "2_otpInputDisplayed");

                // Phase 3: Enter incorrect OTP and handle error
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
                expect(errorMessage).toContain("Sign-in Error:");

                // Dismiss error banner
                const dismissBtn = await page.$("#dismissErrorBtn");
                if (dismissBtn) {
                    await page.click("#dismissErrorBtn");
                    await screenshot.takeScreenshot(page, "6_errorDismissed");
                }

                // Phase 4: Resend OTP code
                await page.waitForSelector("#resendCodeBtn", { visible: true });
                await page.click("#resendCodeBtn");
                await screenshot.takeScreenshot(page, "7_resendCodeClicked");

                // Wait a moment for resend to process
                await new Promise((resolve) => setTimeout(resolve, 2000));

                // Phase 5: Get new OTP code from email
                const otpCode = await emailOtpClient.readOtpCode();

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

                // Phase 7: Wait for successful sign-in
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
                await screenshot.takeScreenshot(page, "10_signInSuccessful");

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
            const authStatusBanner = await page.$eval(
                "#authStatusBanner",
                (el) => el.textContent
            );
            expect(authStatusBanner).toContain("No user signed in");

            // Take a screenshot of the initialized state
            const setupScreenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/setup`
            );
            await setupScreenshot.takeScreenshot(page, "appInitialized");

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
        });

        it(
            "User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)",
            async () => {
                const testName = "emailOtpSignInRedirect";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter email in the sign-in form and click sign-in button
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailOtpUsername);

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
                expect(errorMessage).toContain("redirect");
            },
            AUTH_TIMEOUT
        );
    });
});
