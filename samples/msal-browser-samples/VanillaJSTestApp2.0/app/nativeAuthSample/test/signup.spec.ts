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

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/signup");
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45; // Standard timeout for operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60; // Extended timeout for auth operations
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120; // Test suite timeout
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign Up Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let signUpEmailWithPwd: string = "";
    let accountPwd: string = "";
    let signUpEmailWithOtp: string = "";
    let testFirstName: string = "";
    let testLastName: string = "";
    let existingPwdEmail: string = "";
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
        signUpEmailWithPwd = "test-pwd@test.com"
        signUpEmailWithOtp = "test-otp@test.com"
        existingPwdEmail = 'nativeauthuser1@1secmail.org';

        testFirstName = "TestFirstName";
        testLastName = "TestLastName";
        accountPwd = "Password123!";
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

    describe("Sign Up Flow - Email + Password", () => {
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

        it("User enters username, attributes to start sign-up flow, and enter the incorrect otp", async () => {
            const testName = "signUpFormDisplay";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the sign-up form and click sign-up button
            await page.waitForSelector("#signUpFirstName", { visible: true });
            await page.waitForSelector("#signUpLastName", { visible: true });
            await page.waitForSelector("#signUpUsername", { visible: true });

            await page.type("#signUpFirstName", testFirstName);
            await page.type("#signUpLastName", testLastName);
            await page.type("#signUpUsername", signUpEmailWithPwd);

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
            await screenshot.takeScreenshot(page, "signUpButtonClicked");

            // Wait for code input card to appear
            await page.waitForSelector("#codeVerificationCard");
            await screenshot.takeScreenshot(page, "codeVerificationCardDisplayed");

            // Enter code and submit - ensure code field is fully visible first
            await page.waitForSelector("#verificationCode", { visible: true });
            await page.type("#verificationCode", "12345678"); // Enter incorrect code
            await screenshot.takeScreenshot(page, "verificationCodeEntered");
            await page.click("#submitCodeBtn");
            await screenshot.takeScreenshot(page, "submitCodeButtonClicked");
            // Wait for error message to appear
            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain("Sign-up Error: Error: invalid_grant: AADSTS50181: Unable to validate the otp");
        }, AUTH_TIMEOUT);

        it("User sign up with existing username", async () => {
            const testName = "signUpWithExistingUsername";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the sign-up form and click sign-up button
            await page.waitForSelector("#signUpFirstName", { visible: true });
            await page.waitForSelector("#signUpLastName", { visible: true });
            await page.waitForSelector("#signUpUsername", { visible: true });

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
            await screenshot.takeScreenshot(page, "signUpButtonClicked");

            // Wait for code input card to appear
            await page.waitForSelector("#codeVerificationCard");
            await screenshot.takeScreenshot(page, "codeVerificationCardDisplayed");

            // Wait for error message to appear
            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain(" Error: user_already_exists: AADSTS1003037");
        }, AUTH_TIMEOUT);
    });

    describe("Sign Up Flow - Redirect", () => {
        beforeEach(async () => {
            // Use useRedirectConfig=true to ensure the app initializes with redirect-only challenge types
            await page.goto(sampleHomeUrl + `?useOtpConfig=true&useRedirectConfig=true`);
            console.log("Navigated to URL with redirect config");

            // Wait for the application to initialize with a longer timeout
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            console.log("Application initialized");

            // Verify that no user signed in initially
            const authStatusBanner = await page.$eval("#authStatusBanner", (el) => el.textContent);
            expect(authStatusBanner).toContain("No user signed in");
            
            // Take a screenshot of the initialized state
            const setupScreenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/setup`
            );
            await setupScreenshot.takeScreenshot(page, "appInitialized");
            
            // Verify sign-up button is visible on the navigation bar
            const showSignUpBtn = await page.$("#showSignUpBtn");
            expect(showSignUpBtn).toBeTruthy();
            console.log("Sign-up button found");

            // Click sign-up button on the navigation bar
            await page.click("#showSignUpBtn");
            console.log("Clicked sign-up button");

            // Verify sign-up card is visible
            const signUpCard = await page.$("#signUpCard");
            expect(signUpCard).toBeTruthy();
            console.log("Sign-up card is visible");

            // Verify sign-up form elements are present
            const usernameInput = await page.$("#signUpUsername");
            const signUpButton = await page.$("#signUpBtn");
            expect(usernameInput).toBeTruthy();
            expect(signUpButton).toBeTruthy();
            console.log("Sign-up form elements are present");
            
            // Log the challenge types currently configured
            await page.evaluate(() => {
                // Use type casting for TypeScript
                const customWindow = window as any;
                if (customWindow.msalConfig && customWindow.msalConfig.customAuth) {
                    console.log("Current challenge types:", 
                        JSON.stringify(customWindow.msalConfig.customAuth.challengeTypes));
                }
            });
        });

        it("User email is registered with email OTP auth method, which is not supported by the developer (redirect flow)", async () => {
            const testName = "emailOtpSignUpRedirect";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter email in the sign-up form and click sign-up button
            await page.waitForSelector("#signUpUsername", { visible: true });
            await page.type("#signUpUsername", signUpEmailWithOtp);

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
            await screenshot.takeScreenshot(page, "signUpButtonClicked");

            // Wait for the error banner to appear with increased timeout
            await page.waitForSelector("#errorBanner", { visible: true, timeout: 15000 });
            await screenshot.takeScreenshot(page, "errorBannerDisplayed");

            // Verify error banner content
            const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
            expect(errorMessage).toContain("redirect: No required authentication");
                
        }, AUTH_TIMEOUT);
    });
});
