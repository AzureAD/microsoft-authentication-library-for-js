/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    setupCredentials,
    ONE_SECOND_IN_MS,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    BrowserCacheUtils,
    LabApiQueryParams,
    AzureEnvironments,
    AppTypes,
    LabClient,
    waitForReturnToApp,
} from "e2e-test-utils";
import path from "path";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(__dirname, "./screenshots/signin");
const SAMPLE_HOME_URL = "http://localhost:3000";

describe("Native Auth Sample - Sign In Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let username = "yongdi.wang1227@gmail.com";
    let accountPwd = "Ucc*71767!";

    beforeAll(async () => {
        createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        browser = await getBrowser();

        // Set up test credentials for B2C Native Auth
        const labApiParams: LabApiQueryParams = {
            azureEnvironment: AzureEnvironments.CLOUD,
            appType: AppTypes.CLOUD,
        };

        const labClient = new LabClient();
        // const envResponse = await labClient.getVarsByCloudEnvironment(
        //     labApiParams
        // );

        // [username, accountPwd] = await setupCredentials(
        //     envResponse[0],
        //     labClient
        // );
    });

    afterAll(async () => {
        await context?.close();
        await browser?.close();
    });


    beforeEach(async () => {
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(ONE_SECOND_IN_MS * 10);

        BrowserCache = new BrowserCacheUtils(
            page,
            "sessionStorage" // Based on Native Auth Sample configuration
        );            // Navigate to the Native Auth Sample home page and wait for network idle to ensure full page load
        await page.goto(SAMPLE_HOME_URL, { waitUntil: 'networkidle0' });

        // Wait for the application to initialize
        await pcaInitializedPoller(page, 10000); // Increase timeout for more stability
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

        it("User enters username and correct password", async () => {
            const testName = "signInFormDisplay";
            const screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
            );

            // Enter username in the sign-in form and click sign-in button
            await page.waitForSelector("#username", { visible: true });
            await page.type("#username", username);
            
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
            await page.waitForSelector("#signInPassword", { visible: true });
            await page.type("#signInPassword", accountPwd);
            await screenshot.takeScreenshot(page, "passwordInputEntered");
            
            // Wait for the submit button to be visible and enabled
            await page.waitForSelector("#submitPasswordBtn:enabled", { visible: true, timeout: 15000 });
            // Use evaluate to ensure a clean click operation rather than direct page.click()
            await page.evaluate(() => {
                const submitButton = document.getElementById("submitPasswordBtn");
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
                    const authStatusBanner = document.getElementById("authStatusBanner");
                    const isSignedIn = authStatusBanner && authStatusBanner.textContent?.includes("Signed in");
                    
                    // Also check account info if it exists
                    const accountInfo = document.getElementById("accountInfo");
                    const hasAccountInfo = accountInfo && !accountInfo.textContent?.includes("No account information available");
                    
                    // Return true if either condition is satisfied
                    return isSignedIn || hasAccountInfo;
                },
                { timeout: 30000 } // Increase timeout for more reliability
            );
            const tokenStore = await BrowserCache.getTokens();
            console.log("Token Store:", tokenStore);
            expect(tokenStore.idTokens).toHaveLength(1);
            expect(tokenStore.accessTokens).toHaveLength(1);
            expect(tokenStore.refreshTokens).toHaveLength(1);
            expect(
                await BrowserCache.getAccountFromCache()
            ).toBeDefined();
            expect(
                await BrowserCache.accessTokenForScopesExists(
                    tokenStore.accessTokens,
                    ["openid", "profile", "user.read"]
                )
            ).toBeTruthy();
        }, 60000);

        // it("User enters username and incorrect password", async () => {
        //     const testName = "incorrectPasswordSignIn";
        //     const screenshot = new Screenshot(
        //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
        //     );

        //     // Enter username in the sign-in form and click sign-in button
        //     await page.type("#username", username);
        //     await page.click("#signInBtn");
        //     await screenshot.takeScreenshot(page, "signInButtonClicked");

        //     // Wait for password input card to appear
        //     await page.waitForSelector("#passwordInputCard");
        //     await screenshot.takeScreenshot(page, "passwordInputDisplayed");

        //     // Enter incorrect password and submit
        //     await page.type("#signInPassword", "WrongPassword123!");
        //     await screenshot.takeScreenshot(page, "incorrectPasswordEntered");
            
        //     // wait for the submit button to be enabled
        //     await page.waitForSelector("#submitPasswordBtn:enabled");
        //     await page.click("#submitPasswordBtn");
        //     await screenshot.takeScreenshot(page, "incorrectPasswordSubmitted");

        //     // Wait for the error banner to appear
        //     await page.waitForSelector("#errorBanner", { visible: true, timeout: 5000 });
        //     await screenshot.takeScreenshot(page, "errorBannerDisplayed");
            
        //     // Verify error banner content
        //     const errorMessage = await page.$eval("#errorMessage", (el) => el.textContent);
        //     expect(errorMessage).toContain("Sign-in Error:");
            
        //     // Verify that the user is still not signed in
        //     const authStatusBanner = await page.$eval("#authStatusBanner", (el) => el.textContent);
        //     expect(authStatusBanner).toContain("No user signed in");
            
        //     // Verify we're still on the password input form
        //     const passwordInputCard = await page.$("#passwordInputCard");
        //     expect(passwordInputCard).toBeTruthy();
            
        //     const isVisible = await page.evaluate(() => {
        //         const card = document.getElementById("passwordInputCard");
        //         return card && window.getComputedStyle(card).display !== "none";
        //     });
        //     expect(isVisible).toBe(true);
            
        //     // Try dismissing the error banner
        //     await page.click("#dismissErrorBtn");
            
        //     // Verify error banner is hidden
        //     const errorBannerVisible = await page.evaluate(() => {
        //         const banner = document.getElementById("errorBanner");
        //         return banner ? window.getComputedStyle(banner).display !== "none" : false;
        //     });
        //     expect(errorBannerVisible).toBe(false);
        // }, 60000);

        it("User signs in with account B when account A has already signed in", async () => {
        });

        it("User email is registered with email OTP auth method, which is supported by the developer", async () => {
        });

        it(" User email is registered with email OTP auth method, which is not supported by the developer (aka redirect flow)", async () => {
        });
    });

    // it("Should start sign-in flow when username and password are entered", async () => {
    //     const testName = "signInFlowStart";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     await screenshot.takeScreenshot(page, "beforeSignInStart");

    //     // Enter username in the sign-in form
    //     await page.type("#username", username);
    //     await screenshot.takeScreenshot(page, "usernameEntered");

    //     // Click sign-in button
    //     await page.click("#signInBtn");
    //     await screenshot.takeScreenshot(page, "signInButtonClicked");

    //     // Wait for either password input card or code verification card to appear
    //     try {
    //         await page.waitForSelector("#passwordInputCard,#codeVerificationCard", {
    //             visible: true,
    //             timeout: 10000
    //         });
    //         await screenshot.takeScreenshot(page, "nextStepDisplayed");
    //     } catch (error) {
    //         await screenshot.takeScreenshot(page, "errorAfterSignInClick");
    //         throw new Error("Expected password input or code verification step to appear");
    //     }
    // });

    // it("Should handle password-based sign-in flow", async () => {
    //     const testName = "passwordSignInFlow";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Start sign-in flow
    //     await page.type("#username", username);
    //     await page.click("#signInBtn");

    //     // Wait for password input card
    //     try {
    //         await page.waitForSelector("#passwordInputCard", {
    //             visible: true,
    //             timeout: 10000
    //         });
    //         await screenshot.takeScreenshot(page, "passwordInputDisplayed");

    //         // Enter password
    //         await page.type("#signInPassword", accountPwd);
    //         await screenshot.takeScreenshot(page, "passwordEntered");

    //         // Submit password
    //         await page.click("#submitPasswordBtn");
    //         await screenshot.takeScreenshot(page, "passwordSubmitted");

    //         // Wait for successful sign-in (account info should be displayed)
    //         await page.waitForFunction(
    //             () => {
    //                 const accountInfo = document.getElementById("accountInfo");
    //                 return accountInfo && !accountInfo.textContent?.includes("No account information available");
    //             },
    //             { timeout: 15000 }
    //         );

    //         await screenshot.takeScreenshot(page, "signInCompleted");

    //         // Verify account information is displayed
    //         const accountInfoText = await page.$eval("#accountInfo", el => el.textContent);
    //         expect(accountInfoText).not.toContain("No account information available");

    //     } catch (error) {
    //         await screenshot.takeScreenshot(page, "passwordFlowError");
    //         throw error;
    //     }
    // });

    // it("Should handle code verification sign-in flow", async () => {
    //     const testName = "codeVerificationFlow";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Start sign-in flow
    //     await page.type("#username", username);
    //     await page.click("#signInBtn");

    //     // Wait for code verification card
    //     try {
    //         await page.waitForSelector("#codeVerificationCard", {
    //             visible: true,
    //             timeout: 10000
    //         });
    //         await screenshot.takeScreenshot(page, "codeVerificationDisplayed");

    //         // Note: In a real test, you would need to retrieve the verification code
    //         // from the email or use a test account that provides the code
    //         // For this test, we'll simulate the interaction without a real code

    //         const verificationCodeInput = await page.$("#verificationCode");
    //         expect(verificationCodeInput).toBeTruthy();

    //         const submitCodeButton = await page.$("#submitCodeBtn");
    //         expect(submitCodeButton).toBeTruthy();

    //         const resendCodeButton = await page.$("#resendCodeBtn");
    //         expect(resendCodeButton).toBeTruthy();

    //         await screenshot.takeScreenshot(page, "codeVerificationFormVerified");

    //     } catch (error) {
    //         // If code verification doesn't appear, that's okay - it depends on the account type
    //         console.log("Code verification flow not triggered - may be password-based account");
    //     }
    // });

    // it("Should allow canceling from password input", async () => {
    //     const testName = "passwordInputCancel";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Start sign-in flow
    //     await page.type("#username", username);
    //     await page.click("#signInBtn");

    //     // Wait for password input card
    //     try {
    //         await page.waitForSelector("#passwordInputCard", {
    //             visible: true,
    //             timeout: 10000
    //         });

    //         // Click cancel button
    //         await page.click("#cancelPasswordBtn");
    //         await screenshot.takeScreenshot(page, "passwordCanceled");

    //         // Verify we're back to the initial sign-in form
    //         const isSignInCardVisible = await page.evaluate(() => {
    //             const card = document.getElementById("signInCard");
    //             return card && window.getComputedStyle(card).display !== "none";
    //         });
    //         expect(isSignInCardVisible).toBe(true);

    //     } catch (error) {
    //         // If password input doesn't appear, skip this test
    //         console.log("Password input not displayed - skipping cancel test");
    //     }
    // });

    // it("Should allow canceling from code verification", async () => {
    //     const testName = "codeVerificationCancel";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Start sign-in flow
    //     await page.type("#username", username);
    //     await page.click("#signInBtn");

    //     // Wait for code verification card
    //     try {
    //         await page.waitForSelector("#codeVerificationCard", {
    //             visible: true,
    //             timeout: 10000
    //         });

    //         // Click cancel button
    //         await page.click("#cancelCodeBtn");
    //         await screenshot.takeScreenshot(page, "codeVerificationCanceled");

    //         // Verify we're back to the initial sign-in form
    //         const isSignInCardVisible = await page.evaluate(() => {
    //             const card = document.getElementById("signInCard");
    //             return card && window.getComputedStyle(card).display !== "none";
    //         });
    //         expect(isSignInCardVisible).toBe(true);

    //     } catch (error) {
    //         // If code verification doesn't appear, skip this test
    //         console.log("Code verification not displayed - skipping cancel test");
    //     }
    // });

    // it("Should handle resend code functionality", async () => {
    //     const testName = "resendCodeFlow";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Start sign-in flow
    //     await page.type("#username", username);
    //     await page.click("#signInBtn");

    //     // Wait for code verification card
    //     try {
    //         await page.waitForSelector("#codeVerificationCard", {
    //             visible: true,
    //             timeout: 10000
    //         });

    //         // Click resend code button
    //         await page.click("#resendCodeBtn");
    //         await screenshot.takeScreenshot(page, "codeResendClicked");

    //         // Verify the resend functionality was triggered
    //         // Note: In a real implementation, you might check for a success message
    //         // or other UI feedback indicating the code was resent

    //     } catch (error) {
    //         // If code verification doesn't appear, skip this test
    //         console.log("Code verification not displayed - skipping resend test");
    //     }
    // });

    // it("Should validate required fields", async () => {
    //     const testName = "fieldValidation";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Try to submit empty form
    //     await page.click("#signInBtn");
    //     await screenshot.takeScreenshot(page, "emptyFormSubmitted");

    //     // Check if HTML5 validation prevents submission
    //     const usernameInput = await page.$("#username");
    //     const isUsernameInvalid = await page.evaluate((input) => {
    //         return !input.checkValidity();
    //     }, usernameInput);

    //     expect(isUsernameInvalid).toBe(true);
    // });

    // it("Should switch between sign-in and sign-up views", async () => {
    //     const testName = "viewSwitching";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Initially should show sign-in
    //     let isSignInVisible = await page.evaluate(() => {
    //         const card = document.getElementById("signInCard");
    //         return card && window.getComputedStyle(card).display !== "none";
    //     });
    //     expect(isSignInVisible).toBe(true);

    //     // Click sign-up button
    //     await page.click("#showSignUpBtn");
    //     await screenshot.takeScreenshot(page, "signUpViewShown");

    //     // Verify sign-up is now visible
    //     let isSignUpVisible = await page.evaluate(() => {
    //         const card = document.getElementById("signUpCard");
    //         return card && window.getComputedStyle(card).display !== "none";
    //     });
    //     expect(isSignUpVisible).toBe(true);

    //     // Click sign-in button to switch back
    //     await page.click("#showSignInBtn");
    //     await screenshot.takeScreenshot(page, "backToSignInView");

    //     // Verify sign-in is visible again
    //     isSignInVisible = await page.evaluate(() => {
    //         const card = document.getElementById("signInCard");
    //         return card && window.getComputedStyle(card).display !== "none";
    //     });
    //     expect(isSignInVisible).toBe(true);
    // });

    // it("Should display appropriate error messages for invalid credentials", async () => {
    //     const testName = "invalidCredentials";
    //     const screenshot = new Screenshot(
    //         `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
    //     );

    //     // Enter invalid username
    //     await page.type("#username", "invalid@example.com");
    //     await page.click("#signInBtn");

    //     // Wait for error handling or appropriate response
    //     await page.waitForTimeout(3000);
    //     await screenshot.takeScreenshot(page, "invalidCredentialsHandled");

    //     // Note: The specific error handling depends on the Native Auth implementation
    //     // This test verifies that the application doesn't crash with invalid input
    // });

});