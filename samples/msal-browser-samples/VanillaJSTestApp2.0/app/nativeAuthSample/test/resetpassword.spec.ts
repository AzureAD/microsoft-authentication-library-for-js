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
    getHomeUrl
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import path = require("path");
import { startCorsProxy, stopCorsProxy } from "./proxyUtils";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/reserpassword");
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45; // Standard timeout for operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60; // Extended timeout for auth operations
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120; // Test suite timeout
let sampleHomeUrl = "";

describe("Native Auth Sample - Reser Password Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let resetPasswordEmailWithPwd: string = "";
    let resetPasswordEmailWithOtp: string = "";
    let corsProcess: ChildProcess;
    

    beforeAll(async () => {
        // Start the CORS proxy server using the utility function
        corsProcess = await startCorsProxy(
            "MSIDLABCIAM6", 
            "fe362aec-5d43-45d1-b730-9755e60dc3b9", 
            30001
        );

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        let labClient = new LabClient();

        // this will be replaced with the actual email and password used for testing
        resetPasswordEmailWithPwd = 'nativeauthuser1@1secmail.org';
        resetPasswordEmailWithOtp = 'nativeauthuser5@chefalicious.com';
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
        );            // Navigate to the Native Auth Sample home page and wait for network idle to ensure full page load
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

    describe("Reset Password Flow", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl);

            // Wait for the application to initialize
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            // Verify reset password button is visible on the navigation bar
            const showResetPasswordButton = await page.$("#showResetPasswordBtn");
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

        it("User reset password with incorrect otp", async () => {
            const testName = "resetPasswordFormDisplay";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the reset password form and click reset password button
            await page.waitForSelector("#resetPasswordEmail", { visible: true });
            await page.type("#resetPasswordEmail", resetPasswordEmailWithPwd);
            // Make sure reset password button is visible and clickable
            await page.waitForSelector("#resetPasswordBtn", { visible: true });

            // Use evaluate to click to avoid potential click issues
            await page.evaluate(() => {
                const resetPasswordButton = document.getElementById("resetPasswordBtn");
                if (resetPasswordButton) {
                    resetPasswordButton.click();
                } else {
                    throw new Error("Sign in button not found in the DOM");
                }
            });
            await screenshot.takeScreenshot(page, "resetPasswordButtonClicked");

            // Wait for code input card to appear
            await page.waitForSelector("#resetPasswordCodeCard");
            await screenshot.takeScreenshot(page, "resetPasswordCodeCard");

            // Enter code and submit - ensure code field is fully visible first
            await page.waitForSelector("#resetPasswordCode", { visible: true });
            await page.type("#resetPasswordCode", "12345678"); // Enter incorrect code
            await screenshot.takeScreenshot(page, "verificationCodeEntered");
            await page.click("#submitResetPasswordCodeBtn");
            await screenshot.takeScreenshot(page, "submitCodeButtonClicked");

            // Wait for error message to appear
            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain("Error: invalid_grant: AADSTS50181: Unable to validate the otp");
        }, AUTH_TIMEOUT);

        it("Email is not found in records", async () => {
            const testName = "resetPasswordWithNonExistingUsername";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the reset password form and click reset password button
            await page.waitForSelector("#resetPasswordEmail", { visible: true });
            await page.type("#resetPasswordEmail", "non-existemail@test.com");

            // Make sure reset password button is visible and clickable
            await page.waitForSelector("#resetPasswordBtn", { visible: true });

            // Use evaluate to click to avoid potential click issues
            await page.evaluate(() => {
                const resetPasswordButton = document.getElementById("resetPasswordBtn");
                if (resetPasswordButton) {
                    resetPasswordButton.click();
                } else {
                    throw new Error("Reset Password button not found in the DOM");
                }
            });
            await screenshot.takeScreenshot(page, "resetPasswordButtonClicked");

            // Wait for error message to appear
            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain("");
        }, AUTH_TIMEOUT);

        it("Email exists but not linked to any password (registered using otp flow)", async () => {
            const testName = "resetPasswordWithOtpUsername";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the reset password form and click reset password button
            await page.waitForSelector("#resetPasswordEmail", { visible: true });
            await page.type("#resetPasswordEmail", resetPasswordEmailWithOtp);

            // Make sure reset password button is visible and clickable
            await page.waitForSelector("#resetPasswordBtn", { visible: true });

            // Use evaluate to click to avoid potential click issues
            await page.evaluate(() => {
                const resetPasswordButton = document.getElementById("resetPasswordBtn");
                if (resetPasswordButton) {
                    resetPasswordButton.click();
                } else {
                    throw new Error("Reset Password button not found in the DOM");
                }
            });
            await screenshot.takeScreenshot(page, "resetPasswordButtonClicked");

            // Wait for error message to appear
            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain("");
        }, AUTH_TIMEOUT);
    });

    describe("Reset Password Flow - Redirect", () => {
        beforeEach(async () => {
            // Use useRedirectConfig=true to ensure the app initializes with redirect-only challenge types
            await page.goto(sampleHomeUrl + `?usePwdConfig=true&useRedirectConfig=true`);
            console.log("Navigated to URL with redirect config");

            // Wait for the application to initialize with a longer timeout
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            console.log("Application initialized");

            // Verify reset password button is visible on the navigation bar
            const showResetPasswordButton = await page.$("#showResetPasswordBtn");
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

        it("User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)", async () => {
            const testName = "emailResetPasswordRedirect";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the reset password form and click reset password button
            await page.waitForSelector("#resetPasswordEmail", { visible: true });
            await page.type("#resetPasswordEmail", resetPasswordEmailWithOtp);

            // Make sure reset password button is visible and clickable
            await page.waitForSelector("#resetPasswordBtn", { visible: true });

            // Use evaluate to click to avoid potential click issues
            await page.evaluate(() => {
                const resetPasswordButton = document.getElementById("resetPasswordBtn");
                if (resetPasswordButton) {
                    resetPasswordButton.click();
                } else {
                    throw new Error("Reset Password button not found in the DOM");
                }
            });
            await screenshot.takeScreenshot(page, "resetPasswordButtonClicked");

            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain("Password Reset Error: Error: invalid_request: AADSTS500222:");
                
        }, AUTH_TIMEOUT);
    });
});
