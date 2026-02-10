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
import { startCorsProxy, stopCorsProxy } from "./utils/proxyUtils";
import { MailTmClient } from "./utils/emailProviderUtils";
import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    nativeAuthConfig,
} from "./utils/configUtils";
import {
    TokenVerificationUtils,
    BrowserStateUtils,
    UIInteractionUtils,
} from "./utils/testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/jit"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

/**
 * Select JIT authentication method by finding option with matching text
 * @param page - Puppeteer page instance
 * @param methodType - Type of method to select ("email" or "sms")
 * @returns The value of the selected option
 */
async function selectJitMethod(
    page: puppeteer.Page,
    methodType: "email" | "sms"
): Promise<string> {
    const methodValue = await page.evaluate((type) => {
        const select = document.getElementById(
            "jitAuthMethodSelect"
        ) as HTMLSelectElement;
        if (!select) return null;

        // Find option with text containing the method type
        for (let i = 0; i < select.options.length; i++) {
            const option = select.options[i];
            if (option.text.toLowerCase().includes(type.toLowerCase())) {
                return option.value;
            }
        }
        return null;
    }, methodType);

    expect(methodValue).toBeDefined();
    return methodValue!;
}

describe("Native Auth Sample - JIT Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let corsProcess: ChildProcess;
    let emailProviderPwd: string = "";
    let accountPwd: string = "";
    let jitEmail: string = "";

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

        // Set up passwords from configuration
        emailProviderPwd = nativeAuthConfig.passwordProvider;
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
        jitEmail = nativeAuthConfig.signInEmailPasswordUsernameMfa;
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
        // Clear storage after each test using shared utility
        await BrowserStateUtils.cleanupBrowserState(page);
        await page.close();
    });

    describe("JIT Flow - Sign Up + JIT Registration", () => {
        let screenshot: Screenshot;

        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true&useMFA=true`);
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);

            await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button");
            // Wait for sign up card to be visible
            await page.waitForSelector("#signUpCard", { visible: true });
        });

        it(
            "Sign up with email/password and complete JIT registration using different email",
            async () => {
                const testName = "SignUpWithJit";
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );
                // Click navigation Sign Up button to show sign up card
                await screenshot.takeScreenshot(
                    page,
                    "Sign up form displayed"
                );

                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Enter sign up details
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", "TestFirstName", "First name");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", "TestLastName", "Last name");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", signUpEmail, "Username");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up details entered"
                );

                // Click sign up button
                await UIInteractionUtils.clickElementSafely(page, "#signUpBtn", "Sign up button");
                await screenshot.takeScreenshot(page, "Sign up button clicked");

                // Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(
                    page,
                    "Code verification card displayed"
                );

                // Get OTP code from email
                const otpCode = await emailClient.readOtpCode();
                expect(otpCode).toBeDefined();

                // Enter OTP code
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", otpCode!, "OTP code", true);
                await screenshot.takeScreenshot(page, "OTP code entered");

                // Submit OTP code
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button");
                await screenshot.takeScreenshot(page, "OTP code submitted");

                // Wait for password input card
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(
                    page,
                    "Password card displayed"
                );

                // Enter password
                await UIInteractionUtils.typeIntoElement(page, "#signUpPassword", accountPwd, "Sign up password");
                await screenshot.takeScreenshot(page, "Password entered");

                // Submit password
                await UIInteractionUtils.waitAndClick(page, "#submitSignUpPasswordBtn", "Submit sign up password button");
                await screenshot.takeScreenshot(page, "Password submitted");

                // Wait for JIT method selection card
                await page.waitForSelector("#jitMethodSelectionCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT method selection displayed"
                );

                // Create a new email account for JIT verification (different from sign-up email)
                const { client: jitEmailClient, address: jitEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);

                // Select email OTP as JIT method
                const emailMethodValue = await selectJitMethod(page, "email");
                await page.select("#jitAuthMethodSelect", emailMethodValue);
                await screenshot.takeScreenshot(
                    page,
                    "Email OTP method selected"
                );

                // Enter verification contact (DIFFERENT email from sign-up)
                await UIInteractionUtils.typeIntoElement(page, "#jitVerificationContact", jitEmail, "JIT verification email");
                await screenshot.takeScreenshot(
                    page,
                    "JIT different email entered"
                );

                // Click submit button
                await UIInteractionUtils.clickElementSafely(page, "#submitJitMethodBtn", "Submit JIT method button");
                await screenshot.takeScreenshot(
                    page,
                    "JIT method submit button clicked"
                );

                // Wait for challenge card to appear (verification required scenario)
                await page.waitForSelector("#jitChallengeCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT challenge form displayed"
                );

                // Get OTP code for JIT verification from email
                const jitOtpCode = await jitEmailClient.readOtpCode();
                expect(jitOtpCode).toBeDefined();

                // Enter JIT OTP code
                await UIInteractionUtils.typeIntoElement(page, "#jitChallengeCode", jitOtpCode!, "JIT challenge code", true);
                await screenshot.takeScreenshot(page, "JIT OTP code entered");

                // Submit JIT challenge
                await UIInteractionUtils.clickElementSafely(page, "#submitJitChallengeBtn", "Submit JIT challenge button");

                // Wait for authentication to complete
                await BrowserStateUtils.waitForAuthenticationComplete(page, STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "JIT verified - authentication successful"
                );

                // Verify tokens are in cache
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                // No need to delete inbox, Mail.tm inboxes are ephemeral
            },
            AUTH_TIMEOUT
        );
    });

    describe("JIT Flow - Sign Up new account, then sign in with JIT Verification", () => {
        let screenshot: Screenshot;

        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true&useMFA=true`);
            await pcaInitializedPoller(page, AUTH_TIMEOUT);

            // Verify that no user signed in initially
            await BrowserStateUtils.verifyNotSignedIn(page);
        });

        it(
            "Sign in with existing account and complete JIT registration using OTP",
            async () => {
                const testName = "SignInWithJit";
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/${testName}`
                );
                await screenshot.takeScreenshot(page, "Page loaded");

                // PHASE 1: Create a new account but stop before completing MFA setup
                // This creates an account that exists but hasn't completed JIT registration
                const { client: emailClient, address: signUpEmail } =
                    await MailTmClient.createAuthenticatedAccount(emailProviderPwd);
                const newAccountEmail = signUpEmail;

                // Click navigation Sign Up button to show sign up card
                await UIInteractionUtils.waitAndClick(page, "#showSignUpBtn", "Show sign up button");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up nav button clicked"
                );

                // Wait for sign up card to be visible
                await page.waitForSelector("#signUpCard", { visible: true });

                // Enter sign up details
                await UIInteractionUtils.typeIntoElement(page, "#signUpFirstName", "TestFirstName", "First name");
                await UIInteractionUtils.typeIntoElement(page, "#signUpLastName", "TestLastName", "Last name");
                await UIInteractionUtils.typeIntoElement(page, "#signUpUsername", newAccountEmail, "Username");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up details entered"
                );

                // Click sign up button
                await UIInteractionUtils.clickElementSafely(page, "#signUpBtn", "Sign up button");
                await screenshot.takeScreenshot(page, "Sign up button clicked");

                // Wait for OTP verification card to appear
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(
                    page,
                    "Code verification card displayed"
                );

                // Get OTP code from email
                const signUpOtpCode = await emailClient.readOtpCode();
                expect(signUpOtpCode).toBeDefined();

                // Enter OTP code
                await UIInteractionUtils.typeIntoElement(page, "#verificationCode", signUpOtpCode!, "Sign up OTP code", true);
                await screenshot.takeScreenshot(
                    page,
                    "Sign up OTP code entered"
                );

                // Submit OTP code
                await UIInteractionUtils.waitAndClick(page, "#submitCodeBtn", "Submit OTP button");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up OTP code submitted"
                );

                // Wait for password input card
                await page.waitForSelector("#signUpPasswordCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(
                    page,
                    "Sign up password card displayed"
                );

                // Enter password
                await UIInteractionUtils.typeIntoElement(page, "#signUpPassword", accountPwd, "Sign up password");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up password entered"
                );

                // Submit password - this completes sign up but doesn't set up MFA
                await UIInteractionUtils.waitAndClick(page, "#submitSignUpPasswordBtn", "Submit sign up password button");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up password submitted"
                );

                // Account is now created but MFA not set up
                // Clear session to prepare for sign-in
                await BrowserStateUtils.cleanupBrowserState(page);

                // Reload the page to start fresh
                await page.goto(
                    sampleHomeUrl + `?usePwdConfig=true&useMFA=true`
                );
                await pcaInitializedPoller(page, AUTH_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "Page reloaded for sign in"
                );

                // PHASE 2: Sign in with the newly created account
                // This should trigger JIT because MFA is not set up
                await UIInteractionUtils.waitAndClick(page, "#showSignInBtn", "Show sign in button");
                await screenshot.takeScreenshot(
                    page,
                    "Sign in nav button clicked"
                );

                // Wait for sign in card to be visible
                await page.waitForSelector("#signInCard", { visible: true });

                // Enter sign in details with the newly created account
                await UIInteractionUtils.typeIntoElement(page, "#username", newAccountEmail, "Username");
                await screenshot.takeScreenshot(
                    page,
                    "Sign in details entered"
                );

                // Click sign in button
                await UIInteractionUtils.clickElementSafely(page, "#signInBtn", "Sign in button");
                await screenshot.takeScreenshot(page, "Sign in button clicked");

                // Wait for password input card to appear
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(
                    page,
                    "Password input card displayed"
                );

                // Enter password
                await UIInteractionUtils.typeIntoElement(page, "#signInPassword", accountPwd, "Sign in password");
                await screenshot.takeScreenshot(page, "Password entered");

                // Submit password
                await UIInteractionUtils.waitAndClick(page, "#submitPasswordBtn", "Submit password button");
                await screenshot.takeScreenshot(page, "Password submitted");

                // Wait for JIT method selection card - this proves JIT is triggered
                await page.waitForSelector("#jitMethodSelectionCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT method selection displayed"
                );

                // Create email client for configured JIT email
                const jitEmailClient = await MailTmClient.connectToExistingAccount(jitEmail, emailProviderPwd);

                // Mark checkpoint before triggering OTP for existing email account
                jitEmailClient.markCheckpoint();

                // Select email OTP as JIT method
                const emailMethodValue = await selectJitMethod(page, "email");
                await page.select("#jitAuthMethodSelect", emailMethodValue);
                await screenshot.takeScreenshot(
                    page,
                    "Email OTP method selected"
                );

                // Enter the JIT email address
                await UIInteractionUtils.typeIntoElement(page, "#jitVerificationContact", jitEmail, "JIT verification email");
                await screenshot.takeScreenshot(page, "JIT email entered");

                // Click submit button
                await UIInteractionUtils.waitAndClick(page, "#submitJitMethodBtn", "Submit JIT method button");
                await screenshot.takeScreenshot(
                    page,
                    "JIT method submit button clicked"
                );

                // Wait for challenge card to appear
                await page.waitForSelector("#jitChallengeCard", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT challenge form displayed"
                );

                // Get OTP code for JIT verification from configured email
                const jitOtpCode = await jitEmailClient.readOtpCode();
                expect(jitOtpCode).toBeDefined();
                // Enter JIT OTP code
                await UIInteractionUtils.typeIntoElement(page, "#jitChallengeCode", jitOtpCode!, "JIT challenge code", true);
                await screenshot.takeScreenshot(page, "JIT OTP code entered");

                // Submit JIT challenge
                await UIInteractionUtils.waitAndClick(page, "#submitJitChallengeBtn", "Submit JIT challenge button");

                // Wait for authentication to complete
                await BrowserStateUtils.waitForAuthenticationComplete(page, STANDARD_TIMEOUT);
                await screenshot.takeScreenshot(
                    page,
                    "JIT verified - authentication successful"
                );

                // Verify tokens are in cache
                await TokenVerificationUtils.verifySuccessfulAuthentication(BrowserCache);

                // No need to delete inbox, Mail.tm inboxes are ephemeral
            },
            AUTH_TIMEOUT
        );
    });
});
