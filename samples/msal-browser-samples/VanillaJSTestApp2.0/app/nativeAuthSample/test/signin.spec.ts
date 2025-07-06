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

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/signin");
const AUTH_STATUS = {
    SIGNED_IN: "Signed in"
} as const;

// Test timeouts
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120;  // 2 minutes for full test timeout
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45;  // 45 seconds for standard operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60;      // 60 seconds for auth operations

const SCREENSHOT_NAMES = {
    CLICK_SIGNIN: "click-signin",
    INITIAL_STATE: "initial-state",
    DUPLICATE_SIGNIN_ATTEMPT: "duplicate-signin-attempt",
    DUPLICATE_SIGNIN_ERROR: "duplicate-signin-error",
    EMPTY_USERNAME_ERROR: "empty-username-error",
    SUBMIT_USERNAME: "submit-username",
    SUBMIT_EMPTY_PASSWORD: "submit-empty-password",
    SUBMIT_DISABLED: "submit-disabled",
    OTP_INPUT_DISPLAYED: "otp-input-displayed",
    INVALID_OTP_ENTERED: "invalid-otp-entered",
    INVALID_OTP_ERROR: "invalid-otp-error",
    TOKEN_CACHE_AFTER_SIGNIN: "token-cache-after-signin",
    AFTER_SIGNOUT: "after-signout",
    USERNAME_ENTERED: "username-entered",
    PASSWORD_ENTERED: "password-entered",
    SIGN_IN_COMPLETE: "sign-in-complete",
    SIGN_IN_ERROR: "sign-in-error",
    ERROR_STATE: "error-state",
    STATE_AFTER_RELOAD: "state-after-reload",
    TOKEN_STORAGE_CHECK: "token-storage-check",
    RESEND_OTP_SUCCESS: "resend-otp-success"
} as const;

const ERROR_MESSAGES = {
    SIGN_IN_ERROR: "Sign-in Error",
    USERNAME_REQUIRED: "Username is required",
    PASSWORD_REQUIRED: "Password is required",
    INVALID_USERNAME: "Invalid username format",
    USER_ALREADY_SIGNED_IN: "user_already_signed_in",
    INVALID_CODE: "Unable to validate the otp",
    NONEXIST_EMAIL: "does not exist"
} as const;

const TEST_CREDENTIALS = {
    EMAIL: "yongdi.wang1227@gmail.com",
    OTPEMAIL: "ydi.w127@gmail.com",
    PASSWORD: "Ucc*71767!",
    WRONG_PASSWORD: "wrongpassword",
    INVALID_OTP: "00000000",
    INVALID_EMAIL: "notanemail"
} as const;

const TEST_NAMES = {
    PASSWORD_SIGN_IN: "password-sign-in",
    INVALID_CREDS: "invalid-credentials",
    DUPLICATE_SIGN_IN: "duplicate-sign-in",
    STATE_AFTER_RELOAD: "state-after-reload",
    OTP_FLOW: "otp-flow",
    INVALID_OTP: "invalid-otp",
    INVALID_USERNAME: "invalid-username",
    TOKEN_CACHE: "token-cache",
    SIGN_OUT: "sign-out",
    EMPTY_USERNAME: "empty-username",
    EMPTY_PASSWORD: "empty-password",
    MAX_USERNAME: "max-username",
    DISABLED_SUBMIT: "disabled-submit",
    TOKEN_STORAGE: "token-storage",
    RESEND_OTP: "resend-otp"
} as const;

const TOKEN_TYPES = {
    ID_TOKEN: "idtoken",
    ACCESS_TOKEN: "accesstoken",
    REFRESH_TOKEN: "refreshtoken"
} as const;

// Define scopes
const DEFAULT_SCOPES: string[] = ["openid", "profile"];

const SELECTORS = {
    signInBtn: "#showSignInBtn",     // Nav button
    signOutBtn: "#navSignOutBtn",    // Sign out nav button
    resendOtpBtn: "#resendCodeBtn",  // Resend OTP button
    usernameInput: "#username",      // Sign in username field
    passwordInput: "#signInPassword", // Password input in password card
    submitBtn: "#signInBtn",         // Sign in form submit button
    submitPasswordBtn: "#submitPasswordBtn", // Password form submit button
    errorMessage: "#errorMessage",    // Error message display
    errorBanner: "#errorBanner",      // Error banner container
    authStatus: "#authStatusBanner", // Auth status banner
    passwordCard: "#passwordInputCard", // Password input card
    otpCard: "#codeVerificationCard",  // Code verification card
    otpInput: "#verificationCode",     // OTP verification code input
    submitOtpBtn: "#submitCodeBtn",    // Submit OTP code button
    signInForm: "#signInForm"          // Sign in form
};

describe("Native Auth Sample - Sign In Tests", () => {
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let browserCache: BrowserCacheUtils;
    let corsProcess: ChildProcess;
    let sampleHomeUrl: string;

    beforeAll(async () => {
        corsProcess = await startCorsProxy(
            "ciamtestlocal",
            "cd97f2df-f1e9-4ee6-8dc0-d036accad626",
            30001
        );

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();
        context = await browser.createBrowserContext();
    });

    afterAll(async () => {
        await context?.close();
        await browser?.close();
        stopCorsProxy(corsProcess);
    });

    beforeEach(async () => {
        page = await context.newPage();
        browserCache = new BrowserCacheUtils(page, "sessionStorage");
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    describe("Password-based Sign In", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?usePwdConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });
        
        it("completes successful sign-in", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.PASSWORD_SIGN_IN}`);
            await signInUserWithPwd(page, TEST_CREDENTIALS.EMAIL, TEST_CREDENTIALS.PASSWORD, screenshot);
            
            await validateAuthState(page, browserCache);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_COMPLETE);
        });

        it("handles invalid credentials", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_CREDS}`);
            
            // Navigate to sign-in form
            await clickSignInNav(page, screenshot);
            
            // Submit username (should succeed)
            await submitUsername(page, TEST_CREDENTIALS.EMAIL, screenshot);
            
            // Submit wrong password (should fail)
            await submitPassword(page, TEST_CREDENTIALS.WRONG_PASSWORD, screenshot);
            
            // Validate error state
            await validateErrorState(page, ERROR_MESSAGES.SIGN_IN_ERROR);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        });

        it("prevents duplicate sign-in", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.DUPLICATE_SIGN_IN}`);
            
            // First sign-in
            await signInUserWithPwd(page, TEST_CREDENTIALS.EMAIL, TEST_CREDENTIALS.PASSWORD, screenshot);
            await validateAuthState(page, browserCache);

            // Try to navigate to sign-in form and submit username again
            await clickSignInNav(page, screenshot);
            await submitUsername(page, TEST_CREDENTIALS.EMAIL, screenshot);
            
            // Validate error state immediately after navigation attempt
            await validateErrorState(page, ERROR_MESSAGES.USER_ALREADY_SIGNED_IN);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.DUPLICATE_SIGNIN_ERROR);
        });

        it("maintains sign-in state after reload", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.STATE_AFTER_RELOAD}`);
            
            await signInUserWithPwd(page, TEST_CREDENTIALS.EMAIL, TEST_CREDENTIALS.PASSWORD, screenshot);
            await validateAuthState(page, browserCache);
            
            await page.reload();
            await validateAuthState(page, browserCache);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.STATE_AFTER_RELOAD);
        });
    });

    describe("OTP-based Sign In", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?useOtpConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it("initiates OTP flow", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.OTP_FLOW}`);
            await initiateOtpSignIn(page, TEST_CREDENTIALS.OTPEMAIL, screenshot);
            await page.waitForSelector(SELECTORS.otpInput, { visible: true, timeout: STANDARD_TIMEOUT });
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.OTP_INPUT_DISPLAYED);
        });

        it("validates username format", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_USERNAME}`);
            
            // Navigate to sign-in form
            await clickSignInNav(page, screenshot);
            
            // Submit invalid email format
            await submitUsername(page, TEST_CREDENTIALS.INVALID_EMAIL, screenshot);
            
            // Validate error state
            await validateErrorState(page, ERROR_MESSAGES.NONEXIST_EMAIL);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        });

        it("handles invalid OTP", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_OTP}`);
            
            // Initiate OTP flow and enter invalid code
            await initiateOtpSignIn(page, TEST_CREDENTIALS.OTPEMAIL, screenshot);
            await submitOtpCode(page, TEST_CREDENTIALS.INVALID_OTP, screenshot);
            // Validate error state
            await validateErrorState(page, ERROR_MESSAGES.INVALID_CODE);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INVALID_OTP_ERROR);
        });

        it("handles OTP resend", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.RESEND_OTP}`);
            
            // Initiate OTP flow
            await initiateOtpSignIn(page, TEST_CREDENTIALS.OTPEMAIL, screenshot);
            
            // Click resend button
            await page.waitForSelector(SELECTORS.resendOtpBtn, { visible: true, timeout: STANDARD_TIMEOUT });
            await page.evaluate(() => {
                const resendButton = document.getElementById("resendCodeBtn");
                if (resendButton) {
                    resendButton.click();
                } else {
                    throw new Error("Resend OTP button not found in the DOM");
                }
            });
            
            // Verify OTP input is still displayed after resend
            await validateOtpInputState(page, screenshot);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.RESEND_OTP_SUCCESS);
        });
    });

    describe("Token Cache Management", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?usePwdConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });
        it("validates token cache after sign-in", async () => {
            
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.TOKEN_CACHE}`);
            
            // First ensure successful sign-in
            await signInUserWithPwd(page, TEST_CREDENTIALS.EMAIL, TEST_CREDENTIALS.PASSWORD, screenshot);
            await validateAuthState(page, browserCache);
            
            // Then validate token presence and attributes
            const tokenStore = await browserCache.getTokens();
            await validateTokens(browserCache, { 
                page, 
                screenshot,
                validateScopes: DEFAULT_SCOPES 
            });
            
            // Cleanup
            await browserCache.removeTokens(tokenStore.accessTokens);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.TOKEN_CACHE_AFTER_SIGNIN);
        });

        it("clears token cache on sign-out", async () => {
            
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.SIGN_OUT}`);
            await signInUserWithPwd(page, TEST_CREDENTIALS.EMAIL, TEST_CREDENTIALS.PASSWORD, screenshot);
            await validateAuthState(page, browserCache);
            await signOutUser(page);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.AFTER_SIGNOUT);
            
            const sessionStorage = await page.evaluate(() => Object.keys(window.sessionStorage));
            expect(sessionStorage.some(key => key.includes(TOKEN_TYPES.ID_TOKEN))).toBe(false);
            expect(sessionStorage.some(key => key.includes(TOKEN_TYPES.ACCESS_TOKEN))).toBe(false);
            expect(sessionStorage.some(key => key.includes(TOKEN_TYPES.REFRESH_TOKEN))).toBe(false);
        });

        it("validates token storage security", async () => {
            
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.TOKEN_STORAGE}`);
            await signInUserWithPwd(page, TEST_CREDENTIALS.EMAIL, TEST_CREDENTIALS.PASSWORD, screenshot);
            await validateAuthState(page, browserCache);
            const tokenStore = await browserCache.getTokens();
            const sessionStorage = await page.evaluate(() => Object.keys(window.sessionStorage));

            expect(sessionStorage.some(key => key.includes(TOKEN_TYPES.ID_TOKEN))).toBe(true);
            expect(sessionStorage.some(key => key.includes(TOKEN_TYPES.ACCESS_TOKEN))).toBe(true);
            expect(sessionStorage.some(key => key.includes(TOKEN_TYPES.REFRESH_TOKEN))).toBe(true);
            await browserCache.removeTokens(tokenStore.accessTokens);
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.TOKEN_STORAGE_CHECK);
        });
    });
});

/**
 * Validates the current authentication state
 * @param page Puppeteer Page instance
 * @param browserCache BrowserCacheUtils instance
 * @throws Will throw an error if auth state validation fails
 */
async function validateAuthState(page: puppeteer.Page, browserCache: BrowserCacheUtils): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.authStatus, { visible: true, timeout: STANDARD_TIMEOUT });
        
        // Wait for correct auth status with extended timeout
        await page.waitForFunction(
            (selector, expectedStatus) => {
                const element = document.querySelector(selector);
                return element && element.textContent && element.textContent.includes(expectedStatus);
            },
            { timeout: AUTH_TIMEOUT },
            SELECTORS.authStatus,
            AUTH_STATUS.SIGNED_IN
        );

        // Verify browser cache contains Account, idToken, AccessToken and RefreshToken
        await validateTokens(browserCache, {
            page,
            validateScopes: DEFAULT_SCOPES
        });
    } catch (error) {
        console.error("Auth state validation failed:", error);
        throw error;
    }
}

/**
 * Validates error state and message display
 * @param page Puppeteer Page instance
 * @param expectedError Expected error message to verify
 * @param screenshot Optional Screenshot instance for error documentation
 * @throws Will throw an error if error validation fails
 */
async function validateErrorState(
    page: puppeteer.Page, 
    expectedError: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.errorBanner, { visible: true, timeout: AUTH_TIMEOUT });
        
        await page.waitForFunction(
            (selector, expectedStatus) => {
                const element = document.querySelector(selector);
                return element && element.textContent && element.textContent.includes(expectedStatus);
            },
            { timeout: AUTH_TIMEOUT },
            SELECTORS.errorMessage,
            expectedError
        );

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
    } catch (error) {
        console.error(`Error state validation failed for "${expectedError}":`, error);
        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}

interface TokenValidationOptions {
    /** Optional scopes to validate */
    validateScopes?: string[];
    /** Optional Screenshot instance for visual documentation */
    screenshot?: Screenshot;
    /** Puppeteer Page instance for screenshots */
    page?: puppeteer.Page;
}

/**
 * Validates the presence and attributes of tokens in browser cache
 * @param browserCache BrowserCacheUtils instance
 * @param options Optional validation options
 * @throws Will throw an error if token validation fails
 */
async function validateTokens(browserCache: BrowserCacheUtils, options: TokenValidationOptions = {}): Promise<void> {
    try {
        // Verify token counts and scopes
        await browserCache.verifyTokenStore({
            accessTokens: 1,
            idTokens: 1,
            refreshTokens: 1,
            scopes: options.validateScopes || [...DEFAULT_SCOPES]  // Create new array to avoid readonly issues
        });

        // Get tokens for detailed validation
        const tokens = await browserCache.getTokens();
        
        // Verify token presence
        expect(tokens.accessTokens.length).toBe(1);
        expect(tokens.idTokens.length).toBe(1);
        expect(tokens.refreshTokens.length).toBe(1);

        // Document token state if screenshot and page provided
        if (options.screenshot && options.page) {
            await options.screenshot.takeScreenshot(options.page, SCREENSHOT_NAMES.TOKEN_CACHE_AFTER_SIGNIN);
        }
    } catch (error) {
        console.error("Token validation failed:", error);
        if (options.screenshot && options.page) {
            await options.screenshot.takeScreenshot(options.page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}

/**
 * Signs out the current user and verifies all UI and cache state changes
 * @param page Puppeteer Page instance
 * @throws Will throw an error if sign out operation fails or state validation fails
 */
async function signOutUser(page: puppeteer.Page): Promise<void> {
    try {
        // Find and click sign out button
        await page.waitForSelector(SELECTORS.signOutBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        const signOutBtn = await page.$(SELECTORS.signOutBtn);
        if (!signOutBtn) {
            throw new Error("Sign out button not found");
        }
        await signOutBtn.click();

        // Wait for and verify sign in button appears
        await page.waitForSelector(SELECTORS.signInBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        const signInBtn = await page.$(SELECTORS.signInBtn);
        if (!signInBtn) {
            throw new Error("Sign in button not found after sign out");
        }
    } catch (error) {
        console.error("Sign out failed:", error);
        throw error;
    }
}

/**
 * Clicks the sign-in navigation button and waits for the form
 * @param page Puppeteer Page instance
 * @param screenshot Optional Screenshot instance for visual documentation
 */
async function clickSignInNav(page: puppeteer.Page, screenshot?: Screenshot): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.signInBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.evaluate(() => {
            const signInButton = document.getElementById("showSignInBtn");
            if (signInButton) {
                signInButton.click();
            } else {
                throw new Error("Sign in button not found in the DOM");
            }
        });
        console.log("Clicked sign-in button");

        await page.waitForSelector(SELECTORS.signInForm, { visible: true, timeout: STANDARD_TIMEOUT });
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INITIAL_STATE);
        console.log("Sign-in form visible");
    } catch (error) {
        console.error("Failed to click sign-in nav:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_ERROR);
        throw error;
    }
}

/**
 * Submits the username in the sign-in form
 * @param page Puppeteer Page instance
 * @param username User's email
 * @param screenshot Optional Screenshot instance for visual documentation
 */
async function submitUsername(
    page: puppeteer.Page,
    username: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.usernameInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.type(SELECTORS.usernameInput, username);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.USERNAME_ENTERED);
        console.log(`Entered username: ${username}`);

        await page.evaluate(() => {
            const submitButton = document.getElementById("signInBtn");
            if (submitButton) {
                submitButton.click();
            } else {
                throw new Error("Submit button not found in the DOM");
            }
        });
        console.log("Submitted username");
    } catch (error) {
        console.error("Username submission failed:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_ERROR);
        throw error;
    }
}

/**
 * Submits the password in the sign-in form
 * @param page Puppeteer Page instance
 * @param password User's password
 * @param screenshot Optional Screenshot instance for visual documentation
 */
async function submitPassword(
    page: puppeteer.Page,
    password: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.passwordInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.type(SELECTORS.passwordInput, password);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.PASSWORD_ENTERED);
        console.log("Entered password");

        await page.waitForSelector(SELECTORS.submitPasswordBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.evaluate(() => {
            const submitPasswordButton = document.getElementById("submitPasswordBtn");
            if (submitPasswordButton) {
                submitPasswordButton.click();
            } else {
                throw new Error("Submit password button not found in the DOM");
            }
        });
        console.log("Submitted password");
    } catch (error) {
        console.error("Password submission failed:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_ERROR);
        throw error;
    }
}

/**
 * Performs the sign-in flow with error handling and visual documentation
 * @param page Puppeteer Page instance
 * @param username User's email
 * @param password User's password
 * @param screenshot Optional Screenshot instance for visual documentation
 */
async function signInUserWithPwd(
    page: puppeteer.Page,
    username: string,
    password: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        // Step 1: Click sign-in nav and wait for form
        await clickSignInNav(page, screenshot);
        
        // Step 2: Submit username and wait for password card
        try {
            await submitUsername(page, username, screenshot);
        } catch (error) {
            // If username submission fails, capture error state and abort
            if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_ERROR);
            console.error("Username submission failed:", error);
            console.error("Current URL:", await page.url());
            throw new Error(`Username submission failed: ${error.message}`);
        }

        // Step 3: Submit password only if username step succeeded
        try {
            await submitPassword(page, password, screenshot);
        } catch (error) {
            // If password submission fails, capture error state and abort
            if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_ERROR);
            console.error("Password submission failed:", error);
            console.error("Current URL:", await page.url());
            throw new Error(`Password submission failed: ${error.message}`);
        }
    } catch (error) {
        // Capture any errors from clickSignInNav or rethrown from username/password steps
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGN_IN_ERROR);
        console.error("Sign in failed:", error);
        console.error("Current URL:", await page.url());
        throw error;
    }
}

/**
 * Initiates the OTP-based sign-in flow
 * @param page Puppeteer Page instance
 * @param username User's email
 * @param screenshot Optional Screenshot instance for visual documentation
 * @throws Will throw an error if OTP flow initiation fails
 */
/**
 * Validates that OTP input elements are properly displayed
 * @param page Puppeteer Page instance
 * @param screenshot Optional Screenshot instance for visual documentation
 */
async function validateOtpInputState(
    page: puppeteer.Page, 
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.otpInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.waitForSelector(SELECTORS.submitOtpBtn, { visible: true, timeout: STANDARD_TIMEOUT });

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.OTP_INPUT_DISPLAYED);
        }
    } catch (error) {
        console.error("OTP input validation failed:", error);
        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}

/**
 * Submits an OTP code in the verification form
 * @param page Puppeteer Page instance
 * @param otpCode The OTP code to submit
 * @param screenshot Optional Screenshot instance for visual documentation
 */
async function submitOtpCode(
    page: puppeteer.Page,
    otpCode: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.otpInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.type(SELECTORS.otpInput, otpCode);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INVALID_OTP_ENTERED);

        await page.evaluate(() => {
            const submitOtpButton = document.getElementById("submitCodeBtn");
            if (submitOtpButton) {
                submitOtpButton.click();
            } else {
                throw new Error("Submit OTP button not found in the DOM");
            }
        });
    } catch (error) {
        console.error("OTP submission failed:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Initiates the OTP-based sign-in flow
 * @param page Puppeteer Page instance
 * @param username User's email
 * @param screenshot Optional Screenshot instance for visual documentation
 * @throws Will throw an error if OTP flow initiation fails
 */
async function initiateOtpSignIn(page: puppeteer.Page, username: string, screenshot?: Screenshot): Promise<void> {
    try {
        // Step 1: Click sign-in nav and wait for form
        await clickSignInNav(page, screenshot);
        
        // Step 2: Submit username and wait for OTP card
        await submitUsername(page, username, screenshot);
        
        // Step 3: Verify OTP input is displayed
        await validateOtpInputState(page, screenshot);
    } catch (error) {
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        console.error("OTP flow initiation failed:", error);
        throw error;
    }
}
