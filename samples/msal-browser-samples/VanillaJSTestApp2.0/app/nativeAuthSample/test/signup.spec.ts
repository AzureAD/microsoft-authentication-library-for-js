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

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/signup");
const AUTH_STATUS = {
    SIGNED_IN: "Signed in",
    REGISTERED: "Registration successful"
} as const;

// Test timeouts
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120;  // 2 minutes for full test timeout
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45;  // 45 seconds for standard operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60;      // 60 seconds for auth operations

const SCREENSHOT_NAMES = {
    CLICK_SIGNUP: "click-signup",
    INITIAL_STATE: "initial-state",
    EMAIL_ENTERED: "email-entered",
    PASSWORD_ENTERED: "password-entered",
    ATTRIBUTES_ENTERED: "attributes-entered",
    SIGNUP_COMPLETE: "signup-complete",
    AUTO_SIGNIN_COMPLETE: "auto-signin-complete",
    OTP_INPUT_DISPLAYED: "otp-input-displayed",
    INVALID_OTP_ENTERED: "invalid-otp-entered",
    INVALID_OTP_ERROR: "invalid-otp-error",
    TOKEN_CACHE_AFTER_SIGNUP: "token-cache-after-signup",
    DUPLICATE_ACCOUNT_ERROR: "duplicate-account-error",
    ERROR_STATE: "error-state"
} as const;

const ERROR_MESSAGES = {
    SIGNUP_ERROR: "Sign-up Error",
    EMAIL_REQUIRED: "Email is required",
    PASSWORD_REQUIRED: "Password is required",
    INVALID_EMAIL: "Invalid email format",
    DUPLICATE_ACCOUNT: "Account already exists",
    INVALID_PASSWORD: "Password does not meet requirements",
    INVALID_CODE: "Unable to validate the otp"
} as const;

const TEST_CREDENTIALS = {
    EMAIL: "test" + Date.now() + "@contoso.com", // Generate unique email
    PASSWORD: "Test123!@#",
    INVALID_EMAIL: "notanemail",
    INVALID_PASSWORD: "weak",
    EXISTING_EMAIL: "existing@contoso.com",
    INVALID_OTP: "000000"
} as const;

const TEST_NAMES = {
    PASSWORD_SIGNUP: "password-signup",
    OTP_SIGNUP: "otp-signup",
    INVALID_CREDS: "invalid-credentials",
    DUPLICATE_ACCOUNT: "duplicate-account",
    INVALID_OTP: "invalid-otp",
    TOKEN_CACHE: "token-cache"
} as const;

const SELECTORS = {
    signUpBtn: "#showSignUpBtn",          // Nav button
    signUpForm: "#signUpForm",            // Main form
    emailInput: "#signUpEmail",           // Email field
    passwordInput: "#signUpPassword",     // Password field
    submitBtn: "#signUpSubmitButton",     // Submit button
    displayNameInput: "#displayName",     // Display name field
    otpInput: "#verificationCode",        // OTP input
    submitOtpBtn: "#submitCodeBtn",       // Submit OTP button
    resendOtpBtn: "#resendCodeBtn",       // Resend OTP button
    errorMessage: "#errorMessage",         // Error message
    errorBanner: "#errorBanner",          // Error banner
    authStatus: "#authStatusBanner",      // Auth status
    welcomeMessage: "#welcomeMessage"      // Welcome message
} as const;

describe("Native Auth Sample - Sign Up Tests", () => {
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

    describe("Password-based Sign Up", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?usePwdConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it("completes successful signup", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.PASSWORD_SIGNUP}`);

            // Start signup flow
            await clickSignUpNav(page, screenshot);

            // Fill and submit registration form
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.EMAIL,
                password: TEST_CREDENTIALS.PASSWORD,
                displayName: "Test User"
            }, screenshot);

            // Validate successful registration and auto sign-in
            await validateSignUpSuccess(page, browserCache, screenshot);
        });

        it("validates email format", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_CREDS}`);
            
            await clickSignUpNav(page, screenshot);
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.INVALID_EMAIL,
                password: TEST_CREDENTIALS.PASSWORD,
                displayName: "Test User"
            }, screenshot);

            await validateErrorState(page, ERROR_MESSAGES.INVALID_EMAIL, screenshot);
        });

        it("validates password requirements", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_CREDS}`);
            
            await clickSignUpNav(page, screenshot);
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.EMAIL,
                password: TEST_CREDENTIALS.INVALID_PASSWORD,
                displayName: "Test User"
            }, screenshot);

            await validateErrorState(page, ERROR_MESSAGES.INVALID_PASSWORD, screenshot);
        });

        it("prevents duplicate account creation", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.DUPLICATE_ACCOUNT}`);
            
            await clickSignUpNav(page, screenshot);
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.EXISTING_EMAIL,
                password: TEST_CREDENTIALS.PASSWORD,
                displayName: "Test User"
            }, screenshot);

            await validateErrorState(page, ERROR_MESSAGES.DUPLICATE_ACCOUNT, screenshot);
        });
    });

    describe("OTP-based Sign Up", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?useOtpConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it("handles invalid OTP", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_OTP}`);
            
            // Start signup and enter initial info
            await clickSignUpNav(page, screenshot);
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.EMAIL,
                displayName: "Test User"
            }, screenshot);

            // Enter and submit invalid OTP
            await submitOtpCode(page, TEST_CREDENTIALS.INVALID_OTP, screenshot);
            await validateErrorState(page, ERROR_MESSAGES.INVALID_CODE, screenshot);
        });

        it("handles OTP resend", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.OTP_SIGNUP}`);
            
            // Start signup and enter initial info
            await clickSignUpNav(page, screenshot);
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.EMAIL,
                displayName: "Test User"
            }, screenshot);

            // Test resend functionality
            await resendOtpCode(page, screenshot);
            await validateOtpInputState(page, screenshot);
        });
    });

    describe("Token Cache Management", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?usePwdConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it("validates token cache after auto sign-in", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.TOKEN_CACHE}`);
            
            // Complete signup flow
            await clickSignUpNav(page, screenshot);
            await submitRegistrationForm(page, {
                email: TEST_CREDENTIALS.EMAIL,
                password: TEST_CREDENTIALS.PASSWORD,
                displayName: "Test User"
            }, screenshot);

            // Validate auto sign-in cache state
            await validateSignUpSuccess(page, browserCache, screenshot);
            await validateTokenCache(browserCache, screenshot, page);
        });
    });
});

// Helper Functions

/**
 * Clicks the sign-up navigation button and waits for the form
 */
async function clickSignUpNav(page: puppeteer.Page, screenshot?: Screenshot): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.signUpBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.signUpBtn);
        
        await page.waitForSelector(SELECTORS.signUpForm, { visible: true, timeout: STANDARD_TIMEOUT });
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INITIAL_STATE);
    } catch (error) {
        console.error("Failed to navigate to sign-up form:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

interface RegistrationData {
    email: string;
    password?: string;
    displayName: string;
}

/**
 * Submits the registration form with provided data
 */
async function submitRegistrationForm(
    page: puppeteer.Page,
    data: RegistrationData,
    screenshot?: Screenshot
): Promise<void> {
    try {
        // Enter email
        await page.waitForSelector(SELECTORS.emailInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.type(SELECTORS.emailInput, data.email);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.EMAIL_ENTERED);

        // Enter password if provided (password-based flow)
        if (data.password) {
            await page.waitForSelector(SELECTORS.passwordInput, { visible: true, timeout: STANDARD_TIMEOUT });
            await page.type(SELECTORS.passwordInput, data.password);
            if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.PASSWORD_ENTERED);
        }

        // Enter display name
        await page.waitForSelector(SELECTORS.displayNameInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.type(SELECTORS.displayNameInput, data.displayName);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ATTRIBUTES_ENTERED);

        // Submit form
        await page.waitForSelector(SELECTORS.submitBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.submitBtn);
    } catch (error) {
        console.error("Registration form submission failed:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Submits an OTP code in the verification form
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

        await page.waitForSelector(SELECTORS.submitOtpBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.submitOtpBtn);
    } catch (error) {
        console.error("OTP submission failed:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Triggers OTP code resend
 */
async function resendOtpCode(page: puppeteer.Page, screenshot?: Screenshot): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.resendOtpBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.resendOtpBtn);
    } catch (error) {
        console.error("OTP resend failed:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Validates that OTP input elements are properly displayed
 */
async function validateOtpInputState(
    page: puppeteer.Page, 
    screenshot?: Screenshot
): Promise<void> {
    try {
        await Promise.all([
            page.waitForSelector(SELECTORS.otpInput, { visible: true, timeout: STANDARD_TIMEOUT }),
            page.waitForSelector(SELECTORS.submitOtpBtn, { visible: true, timeout: STANDARD_TIMEOUT }),
            page.waitForSelector(SELECTORS.resendOtpBtn, { visible: true, timeout: STANDARD_TIMEOUT })
        ]);

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
 * Validates error state and message display
 */
async function validateErrorState(
    page: puppeteer.Page, 
    expectedError: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.errorBanner, { visible: true, timeout: AUTH_TIMEOUT });
        
        await page.waitForFunction(
            (selector, expectedContent) => {
                const element = document.querySelector(selector);
                return element && element.textContent && element.textContent.includes(expectedContent);
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

/**
 * Validates successful registration and auto sign-in state
 */
async function validateSignUpSuccess(
    page: puppeteer.Page,
    browserCache: BrowserCacheUtils,
    screenshot?: Screenshot
): Promise<void> {
    try {
        // Wait for registration success message
        await page.waitForFunction(
            (selector, expectedStatus) => {
                const element = document.querySelector(selector);
                return element && element.textContent && 
                       element.textContent.includes(expectedStatus);
            },
            { timeout: AUTH_TIMEOUT },
            SELECTORS.authStatus,
            AUTH_STATUS.REGISTERED
        );

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.SIGNUP_COMPLETE);
        }

        // Wait for auto sign-in completion
        await page.waitForFunction(
            (selector, expectedStatus) => {
                const element = document.querySelector(selector);
                return element && element.textContent && 
                       element.textContent.includes(expectedStatus);
            },
            { timeout: AUTH_TIMEOUT },
            SELECTORS.authStatus,
            AUTH_STATUS.SIGNED_IN
        );

        // Verify welcome message
        await page.waitForSelector(SELECTORS.welcomeMessage, { visible: true, timeout: STANDARD_TIMEOUT });

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.AUTO_SIGNIN_COMPLETE);
        }

        // Verify token cache state
        await validateTokenCache(browserCache, screenshot, page);
    } catch (error) {
        console.error("Sign-up success validation failed:", error);
        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}

/**
 * Validates the token cache state
 */
async function validateTokenCache(
    browserCache: BrowserCacheUtils,
    screenshot?: Screenshot,
    page?: puppeteer.Page
): Promise<void> {
    try {
        const tokenStore = await browserCache.getTokens();
        
        // Verify token presence
        expect(tokenStore.accessTokens.length).toBe(1);
        expect(tokenStore.idTokens.length).toBe(1);
        expect(tokenStore.refreshTokens.length).toBe(1);

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.TOKEN_CACHE_AFTER_SIGNUP);
        }
    } catch (error) {
        console.error("Token cache validation failed:", error);
        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}
