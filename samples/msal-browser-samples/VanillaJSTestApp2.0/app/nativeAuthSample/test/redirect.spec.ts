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

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/redirect");

// Test timeouts
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120;  // 2 minutes for full test timeout
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45;  // 45 seconds for standard operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60;      // 60 seconds for auth operations

const SCREENSHOT_NAMES = {
    INITIAL_STATE: "initial-state",
    REDIRECT_REQUIRED: "redirect-required",
    ERROR_STATE: "error-state",
    TOKEN_CACHE: "token-cache"
} as const;

const ERROR_MESSAGES = {
    REDIRECT_REQUIRED: "No required authentication method by Microsoft Entra is supported, a fallback to the web-based authentication flow is needed."
} as const;

const TEST_CREDENTIALS = {
    EMAIL: "test@contoso.com"
} as const;

const TEST_NAMES = {
    SIGNIN_REDIRECT: "signin-redirect",
    SIGNUP_REDIRECT: "signup-redirect",
    RESET_REDIRECT: "reset-redirect"
} as const;

const SELECTORS = {
    // Navigation Buttons
    showSignInBtn: "#showSignInBtn",      // Sign in nav button
    showSignUpBtn: "#showSignUpBtn",      // Sign up nav button
    showResetPwdBtn: "#showResetPasswordBtn", // Reset password nav button
    navSignOutBtn: "#navSignOutBtn",      // Sign out button
    
    // Forms
    signInForm: "#signInForm",            // Sign in form
    signUpForm: "#signUpForm",            // Sign up form
    resetPasswordForm: "#resetPasswordForm", // Reset password form
    signUpPasswordForm: "#signUpPasswordForm", // Sign up password form
    codeVerificationForm: "#codeVerificationForm", // Code verification form
    passwordInputForm: "#passwordInputForm", // Password input form
    
    // Input Fields
    username: "#username",                // Sign in username
    signUpUsername: "#signUpUsername",    // Sign up username
    resetPasswordEmail: "#resetPasswordEmail", // Reset password email
    verificationCode: "#verificationCode", // OTP verification code
    
    // Submit Buttons
    signInBtn: "#signInBtn",             // Sign in submit
    signUpBtn: "#signUpBtn",             // Sign up submit
    resetPasswordBtn: "#resetPasswordBtn",// Reset password submit
    submitCodeBtn: "#submitCodeBtn",      // Submit verification code
    
    // State Indicators
    errorMessage: "#errorMessage",         // Error message
    errorBanner: "#errorBanner",          // Error banner
    authStatus: "#authStatusBanner",      // Auth status banner
    welcomeMessage: "#welcomeMessage",     // Welcome message
    pcaInitialized: "#pca-initialized"    // PCA initialization status
} as const;

describe("Native Auth Sample - Redirect Flow Tests", () => {
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
        await page.goto(sampleHomeUrl + "?useOtpConfig=true&useRedirectConfig=true");
        await pcaInitializedPoller(page, AUTH_TIMEOUT);
    });

    afterEach(async () => {
        if (page) {
            await page.close();
        }
    });

    describe("Redirect Flow Tests", () => {
        it("detects sign-in redirect requirement", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.SIGNIN_REDIRECT}`);
            
            // Initiate sign-in
            await initiateSignIn(page, TEST_CREDENTIALS.EMAIL, screenshot);
            
            // Verify redirect required error
            await validateRedirectRequired(page, screenshot);

            // Validate cache is empty (no tokens stored)
            await validateEmptyCache(browserCache, screenshot, page);
        });

        it("detects sign-up redirect requirement", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.SIGNUP_REDIRECT}`);
            
            await initiateSignUp(page, TEST_CREDENTIALS.EMAIL, screenshot);
            await validateRedirectRequired(page, screenshot);
            await validateEmptyCache(browserCache, screenshot, page);
        });

        it("detects password reset redirect requirement", async () => {
            const screenshot = new Screenshot(`${SCREENSHOT_BASE_FOLDER_NAME}/${TEST_NAMES.RESET_REDIRECT}`);
            
            await initiatePasswordReset(page, TEST_CREDENTIALS.EMAIL, screenshot);
            await validateRedirectRequired(page, screenshot);
            await validateEmptyCache(browserCache, screenshot, page);
        });
    });
});

// Helper Functions

/**
 * Initiates sign-in attempt
 */
async function initiateSignIn(
    page: puppeteer.Page,
    email: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.showSignInBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.showSignInBtn);

        // Wait for form
        await page.waitForSelector(SELECTORS.signInForm, { visible: true, timeout: STANDARD_TIMEOUT });

        // Enter email
        await page.type(SELECTORS.username, email);
        await page.click(SELECTORS.signInBtn);

        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INITIAL_STATE);
    } catch (error) {
        console.error("Failed to initiate sign-in:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Initiates sign-up attempt
 */
async function initiateSignUp(
    page: puppeteer.Page,
    email: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.showSignUpBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.showSignUpBtn);

        // Wait for form
        await page.waitForSelector(SELECTORS.signUpForm, { visible: true, timeout: STANDARD_TIMEOUT });

        // Enter email
        await page.type(SELECTORS.signUpUsername, email);
        await page.click(SELECTORS.signUpBtn);

        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INITIAL_STATE);
    } catch (error) {
        console.error("Failed to initiate sign-up:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Initiates password reset attempt
 */
async function initiatePasswordReset(
    page: puppeteer.Page,
    email: string,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.showResetPwdBtn, { visible: true, timeout: STANDARD_TIMEOUT });
        await page.click(SELECTORS.showResetPwdBtn);

        // Wait for form
        await page.waitForSelector(SELECTORS.resetPasswordForm, { visible: true, timeout: STANDARD_TIMEOUT });

        // Enter email
        await page.type(SELECTORS.resetPasswordEmail, email);
        await page.click(SELECTORS.resetPasswordBtn);

        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.INITIAL_STATE);
    } catch (error) {
        console.error("Failed to initiate password reset:", error);
        if (screenshot) await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        throw error;
    }
}

/**
 * Validates that redirect is required
 */
async function validateRedirectRequired(
    page: puppeteer.Page,
    screenshot?: Screenshot
): Promise<void> {
    try {
        await page.waitForSelector(SELECTORS.errorBanner, { visible: true, timeout: STANDARD_TIMEOUT });
        
        await page.waitForFunction(
            (selector, expectedContent) => {
                const element = document.querySelector(selector);
                return element && element.textContent && element.textContent.includes(expectedContent);
            },
            { timeout: STANDARD_TIMEOUT },
            SELECTORS.errorMessage,
            ERROR_MESSAGES.REDIRECT_REQUIRED
        );

        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.REDIRECT_REQUIRED);
        }
    } catch (error) {
        console.error("Redirect requirement validation failed:", error);
        if (screenshot) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}

/**
 * Validates that token cache is empty
 */
async function validateEmptyCache(
    browserCache: BrowserCacheUtils,
    screenshot?: Screenshot,
    page?: puppeteer.Page
): Promise<void> {
    try {
        // Get cache contents
        const tokenStore = await browserCache.getTokens();

        // Verify no tokens present
        expect(tokenStore.accessTokens.length).toBe(0);
        expect(tokenStore.idTokens.length).toBe(0);
        expect(tokenStore.refreshTokens.length).toBe(0);

        if (screenshot && page) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.TOKEN_CACHE);
        }
    } catch (error) {
        console.error("Token cache validation failed:", error);
        if (screenshot && page) {
            await screenshot.takeScreenshot(page, SCREENSHOT_NAMES.ERROR_STATE);
        }
        throw error;
    }
}
