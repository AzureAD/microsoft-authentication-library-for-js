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

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/resetpassword");
const AUTH_STATUS = {
    SIGNED_IN: "Signed in",
    PASSWORD_RESET: "Password reset successful"
} as const;

// Test timeouts
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120;  // 2 minutes for full test timeout
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45;  // 45 seconds for standard operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60;      // 60 seconds for auth operations

const SCREENSHOT_NAMES = {
    CLICK_RESET: "click-reset",
    INITIAL_STATE: "initial-state",
    EMAIL_ENTERED: "email-entered",
    OTP_INPUT_DISPLAYED: "otp-input-displayed",
    INVALID_OTP_ENTERED: "invalid-otp-entered",
    INVALID_OTP_ERROR: "invalid-otp-error",
    NEW_PASSWORD_DISPLAYED: "new-password-displayed",
    NEW_PASSWORD_ENTERED: "new-password-entered",
    PASSWORD_RESET_COMPLETE: "password-reset-complete",
    AUTO_SIGNIN_COMPLETE: "auto-signin-complete",
    TOKEN_CACHE_AFTER_RESET: "token-cache-after-reset",
    ERROR_STATE: "error-state"
} as const;

const ERROR_MESSAGES = {
    RESET_ERROR: "Password Reset Error",
    EMAIL_REQUIRED: "Email is required",
    INVALID_EMAIL: "Invalid email format",
    INVALID_CODE: "Unable to validate the otp",
    INVALID_PASSWORD: "Password does not meet requirements",
    ACCOUNT_NOT_FOUND: "Account not found"
} as const;

const TEST_CREDENTIALS = {
    EMAIL: "test@contoso.com",
    NEW_PASSWORD: "NewTest123!@#",
    INVALID_EMAIL: "notanemail",
    INVALID_PASSWORD: "weak",
    NONEXISTENT_EMAIL: "nonexistent@contoso.com",
    INVALID_OTP: "000000"
} as const;

const TEST_NAMES = {
    PASSWORD_RESET: "password-reset",
    INVALID_EMAIL: "invalid-email",
    NONEXISTENT_ACCOUNT: "nonexistent-account",
    INVALID_OTP: "invalid-otp",
    INVALID_PASSWORD: "invalid-password",
    TOKEN_CACHE: "token-cache"
} as const;

const SELECTORS = {
    resetBtn: "#showResetPasswordBtn",    // Reset nav button
    resetForm: "#resetPasswordForm",      // Main form
    emailInput: "#resetPasswordEmail",    // Email field
    submitEmailBtn: "#submitEmailBtn",    // Submit email button
    otpInput: "#verificationCode",        // OTP input
    submitOtpBtn: "#submitCodeBtn",       // Submit OTP button
    resendOtpBtn: "#resendCodeBtn",       // Resend OTP button
    newPasswordInput: "#newPassword",     // New password input
    confirmPasswordInput: "#confirmPassword", // Confirm password input
    submitPasswordBtn: "#submitPasswordBtn", // Submit password button
    errorMessage: "#errorMessage",         // Error message
    errorBanner: "#errorBanner",          // Error banner
    authStatus: "#authStatusBanner",      // Auth status
    welcomeMessage: "#welcomeMessage"      // Welcome message
} as const;

describe("Native Auth Sample - Password Reset Tests", () => {
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

    describe("Password Reset Flow", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?usePwdConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it("completes successful password reset", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.PASSWORD_RESET}`);
            
            // Start reset flow
            await clickResetPasswordNav(page, screenshot);
            
            // Submit email for reset
            await submitResetEmail(page, TEST_CREDENTIALS.EMAIL, screenshot);
            
            // Enter OTP code (mock)
            await submitOtpCode(page, "123456", screenshot);
            
            // Set new password
            await submitNewPassword(page, TEST_CREDENTIALS.NEW_PASSWORD, screenshot);
            
            // Validate reset completion and auto sign-in
            await validateResetSuccess(page, browserCache, screenshot);
        });

        it("validates email format", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_EMAIL}`);
            
            await clickResetPasswordNav(page, screenshot);
            await submitResetEmail(page, TEST_CREDENTIALS.INVALID_EMAIL, screenshot);
            
            await validateErrorState(page, ERROR_MESSAGES.INVALID_EMAIL, screenshot);
        });

        it("handles nonexistent account", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.NONEXISTENT_ACCOUNT}`);
            
            await clickResetPasswordNav(page, screenshot);
            await submitResetEmail(page, TEST_CREDENTIALS.NONEXISTENT_EMAIL, screenshot);
            
            await validateErrorState(page, ERROR_MESSAGES.ACCOUNT_NOT_FOUND, screenshot);
        });

        it("validates password requirements", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_PASSWORD}`);
            
            await clickResetPasswordNav(page, screenshot);
            await submitResetEmail(page, TEST_CREDENTIALS.EMAIL, screenshot);
            await submitOtpCode(page, "123456", screenshot);
            await submitNewPassword(page, TEST_CREDENTIALS.INVALID_PASSWORD, screenshot);
            
            await validateErrorState(page, ERROR_MESSAGES.INVALID_PASSWORD, screenshot);
        });
    });

    describe("OTP Verification", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + "?useOtpConfig=true");
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it("handles invalid OTP", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_OTP}`);
            
            await clickResetPasswordNav(page, screenshot);
            await submitResetEmail(page, TEST_CREDENTIALS.EMAIL, screenshot);
            await submitOtpCode(page, TEST_CREDENTIALS.INVALID_OTP, screenshot);
            
            await validateErrorState(page, ERROR_MESSAGES.INVALID_CODE, screenshot);
        });

        it("handles OTP resend", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.INVALID_OTP}`);
            
            await clickResetPasswordNav(page, screenshot);
            await submitResetEmail(page, TEST_CREDENTIALS.EMAIL, screenshot);
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
            
            // Complete reset flow
            await clickResetPasswordNav(page, screenshot);
            await submitResetEmail(page, TEST_CREDENTIALS.EMAIL, screenshot);
            await submitOtpCode(page, "123456", screenshot);
            await submitNewPassword(page, TEST_CREDENTIALS.NEW_PASSWORD, screenshot);
            
            // Validate auto sign-in cache state
            await validateResetSuccess(page, browserCache, screenshot);
            await validateTokenCache(browserCache, screenshot, page);
        });
    });
});

// Helper Functions

/**
 * Clicks the reset password navigation button and waits for the form
 */
async function clickResetPasswordNav(page: puppeteer.Page, screenshot?: Screenshot): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.resetBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.resetBtn);
        
        await page.waitForSelector(SELECTORS.resetForm, { visible: true, timeout: STANDARD_TIMEOUT });
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INITIAL_STATE);
    } catch (error) {
        console.error("Failed to navigate to reset password form:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Submits email for password reset
 */
async function submitResetEmail(
    page: puppeteer.Page,
    email: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.emailInput, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.type(SELECTORS.emailInput, email);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.EMAIL_ENTERED);

        await page.waitForSelector(SELECTORS.submitEmailBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.submitEmailBtn);
    } catch (error) {
        console.error("Email submission failed:", error);
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
 * Submits new password
 */
async function submitNewPassword(
    page: puppeteer.Page,
    password: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        // Wait for new password form
        await page.waitForSelector(SELECTORS.newPasswordInput, { visible: true, timeout: STANDARD_TIMEOUT });
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.NEW_PASSWORD_DISPLAYED);

        // Enter new password
        await page.type(SELECTORS.newPasswordInput, password);
        await page.type(SELECTORS.confirmPasswordInput, password);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.NEW_PASSWORD_ENTERED);

        // Submit new password
        await page.waitForSelector(SELECTORS.submitPasswordBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.submitPasswordBtn);
    } catch (error) {
        console.error("New password submission failed:", error);
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
 * Validates successful password reset and auto sign-in state
 */
async function validateResetSuccess(
    page: puppeteer.Page,
    browserCache: BrowserCacheUtils,
    screenshot?: Screenshot
): Promise<void> {
    try {
        // Wait for reset success message
        await page.waitForFunction(
            (selector, expectedStatus) => {
                const element = document.querySelector(selector);
                return element && element.textContent && 
                       element.textContent.includes(expectedStatus);
            },
            { timeout: AUTH_TIMEOUT },
            SELECTORS.authStatus,
            AUTH_STATUS.PASSWORD_RESET
        );

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.PASSWORD_RESET_COMPLETE);
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
        console.error("Reset success validation failed:", error);
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
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.TOKEN_CACHE_AFTER_RESET);
        }
    } catch (error) {
        console.error("Token cache validation failed:", error);
        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}
