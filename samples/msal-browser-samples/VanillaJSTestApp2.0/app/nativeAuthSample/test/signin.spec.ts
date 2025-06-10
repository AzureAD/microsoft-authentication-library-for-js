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
import { spawn, ChildProcess } from "child_process";
import path = require("path");

const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    "./screenshots/signin"
);
const STANDARD_TIMEOUT = ONE_SECOND_IN_MS * 45; // Standard timeout for operations
const AUTH_TIMEOUT = ONE_SECOND_IN_MS * 60; // Extended timeout for auth operations
const TEST_TIMEOUT = ONE_SECOND_IN_MS * 120; // Test suite timeout
let sampleHomeUrl = "";

describe("Native Auth Sample - Sign In Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let signInEmailWithPwd: string = "";
    let accountPwd: string = "";
    let signInEmailWithOtp: string = "";
    let corsProcess: ChildProcess;

    beforeAll(async () => {
        // Start the CORS proxy server
        corsProcess = spawn(
            "node",
            [
                path.join(__dirname, "../cors.js"),
                "-d",
                "yourTenantSubdomain", // replace with actual value or parameterize
                "-t",
                "yourTenantId", // replace with actual value or parameterize
                "-p",
                "30001", // or your desired port
            ],
            {
                stdio: "inherit",
                cwd: path.join(__dirname, ".."),
            }
        );

        // Wait a bit to ensure the proxy is up
        await new Promise((res) => setTimeout(res, 2000));

        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();

        const labClient = new LabClient();

        signInEmailWithPwd = "nativeauthuser1@1secmail.org";
        const accountCredential = await labClient.getSecret("MSIDLABCIAM6");
        accountPwd = accountCredential.value;
        signInEmailWithOtp = "nativeauthuser5@chefalicious.com";
        console.log("Test setup complete");
    });

    afterAll(async () => {
        await context?.close();
        await browser?.close();
        if (corsProcess) {
            corsProcess.kill();
        }
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

    describe("Sign In Flow - Email + Password", () => {
        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true`);

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
            "User enters username and correct password",
            async () => {
                const testName = "signInFormDisplay";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailWithPwd);

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
                await screenshot.takeScreenshot(page, "signInSuccessful");
            },
            AUTH_TIMEOUT
        );

        it(
            "User enters username and incorrect password",
            async () => {
                const testName = "incorrectPasswordSignIn";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await page.type("#username", signInEmailWithPwd);
                await page.click("#signInBtn");
                await screenshot.takeScreenshot(page, "signInButtonClicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard");
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");

                // Enter incorrect password and submit
                await page.waitForSelector("#signInPassword", {
                    visible: true,
                });
                await page.type("#signInPassword", "WrongPassword123!");
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
                await page.type("#username", signInEmailWithPwd);

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
                await page.type("#username", signInEmailWithPwd); // Using account B email
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
                console.log("Error message:", errorMessage);
                expect(errorMessage).toContain(
                    "Error: user_already_signed_in:"
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "User signs in with account B when account A has already signed in",
            async () => {
                const testName = "signInFormErrorWithDifferentAccount";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailWithPwd);

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

                // Now sign in with a different account
                const accountBEmail = "test123@test.com";
                // Click sign-in button again
                await page.click("#showSignInBtn");
                // Verify sign-in card is visible
                const signInCard = await page.$("#signInCard");
                expect(signInCard).toBeTruthy();
                // Enter account B username in the sign-in form
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", accountBEmail); // Using account B email
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

        it(
            "User enters non registered username",
            async () => {
                const testName = "nonRegisteredUsernameSignIn";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter username in the sign-in form and click sign-in button
                const nonRegisteredEmail = "non-registered@test.com";
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
    });

    describe("Sign In Flow - Email + OTP", () => {
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
            "User email is registered with email OTP auth method, which is supported by the developer (unfinished)",
            async () => {
                const testName = "emailOtpSignIn";
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );

                // Enter email in the sign-in form and click sign-in button
                await page.waitForSelector("#username", { visible: true });
                await page.type("#username", signInEmailWithOtp); // Using signInEmailWithOtp instead of username

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

                // Enter OTP and submit - ensure OTP field is fully visible first
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                // Wait for the submit button to be visible and enabled
                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                    timeout: 15000,
                });
                // cannot obtain otp code from email, so just verify the submit button is enabled
                await screenshot.takeScreenshot(
                    page,
                    "otpInputReadyForSubmission"
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + Password Redirect", () => {
        beforeEach(async () => {
            // Use useRedirectConfig=true to ensure the app initializes with redirect-only challenge types
            await page.goto(
                sampleHomeUrl + `?useOtpConfig=true&useRedirectConfig=true`
            );
            console.log("Navigated to URL with redirect config");

            // Wait for the application to initialize with a longer timeout
            await pcaInitializedPoller(page, AUTH_TIMEOUT); // Increase timeout for more stability
            console.log("Application initialized");

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
            console.log("Sign-in button found");

            // Click sign-in button on the navigation bar
            await page.click("#showSignInBtn");
            console.log("Clicked sign-in button");

            // Verify sign-in card is visible
            const signInCard = await page.$("#signInCard");
            expect(signInCard).toBeTruthy();
            console.log("Sign-in card is visible");

            // Verify sign-in form elements are present
            const usernameInput = await page.$("#username");
            const signInButton = await page.$("#signInBtn");
            expect(usernameInput).toBeTruthy();
            expect(signInButton).toBeTruthy();
            console.log("Sign-in form elements are present");

            // Log the challenge types currently configured
            await page.evaluate(() => {
                // Use type casting for TypeScript
                const customWindow = window as any;
                if (
                    customWindow.msalConfig &&
                    customWindow.msalConfig.customAuth
                ) {
                    console.log(
                        "Current challenge types:",
                        JSON.stringify(
                            customWindow.msalConfig.customAuth.challengeTypes
                        )
                    );
                }
            });
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
                await page.type("#username", signInEmailWithOtp); // Using signInEmailWithOtp instead of username

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
                    "redirect: No required authentication"
                );
            },
            AUTH_TIMEOUT
        );
    });
});
