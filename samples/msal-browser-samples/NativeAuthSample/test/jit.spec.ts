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
import { startCorsProxy, stopCorsProxy } from "./proxyUtils";
import { MailTmClient } from "./emailProviderUtils";
import {
    testConfig,
    getTenantInfo,
    getProxyPort,
    getNativeAuthConfigValue,
    NATIVE_AUTH_CONFIG_KEYS,
} from "./configUtils";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "/jit"
);
const AUTH_TIMEOUT = testConfig.timeouts.auth;
let sampleHomeUrl = "";

async function verifyTokensInCache(
    BrowserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await BrowserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);
}

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
    let username: string;
    let emailProviderPwd: string = "";
    let accountPwd: string = "";
    let corsProcess: ChildProcess;

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
        emailProviderPwd = getNativeAuthConfigValue(
            NATIVE_AUTH_CONFIG_KEYS.PASSWORD_PROVIDER
        );
        accountPwd = getNativeAuthConfigValue(
            NATIVE_AUTH_CONFIG_KEYS.PASSWORD_SIGN_IN_EMAIL_CODE
        );
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
        // page.on("console", (msg) => {
        //     const type = msg.type();
        //     const text = msg.text();
        //     console.log(`[Browser ${type}]:`, text);
        // });
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

    describe("JIT Flow - Sign Up + JIT Registration", () => {
        let screenshot: Screenshot;

        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true&useMFA=true`);

            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it(
            "Sign up with email/password and complete JIT registration using different email (requires OTP verification)",
            async () => {
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/SignUpWithJitVerfication`
                );
                await screenshot.takeScreenshot(page, "Page loaded");

                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } =
                    await emailClient.createInbox();
                username = signUpEmail;
                await emailClient.login(signUpEmail, emailProviderPwd);

                // Click navigation Sign Up button to show sign up card
                await page.click("#showSignUpBtn");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up nav button clicked"
                );

                // Wait for sign up card to be visible
                await page.waitForSelector("#signUpCard", { visible: true });

                // Enter sign up details
                await page.type("#signUpFirstName", "TestFirstName");
                await page.type("#signUpLastName", "TestLastName");
                await page.type("#signUpUsername", username);
                await screenshot.takeScreenshot(
                    page,
                    "Sign up details entered"
                );

                // Click sign up button
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    } else {
                        throw new Error("Sign up button not found in the DOM");
                    }
                });
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
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.type("#verificationCode", otpCode!);
                await screenshot.takeScreenshot(page, "OTP code entered");

                // Submit OTP code
                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
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
                await page.waitForSelector("#signUpPassword", {
                    visible: true,
                });
                await page.type("#signUpPassword", accountPwd);
                await screenshot.takeScreenshot(page, "Password entered");

                // Submit password
                await page.waitForSelector("#submitSignUpPasswordBtn:enabled", {
                    visible: true,
                });
                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitSignUpPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    } else {
                        throw new Error(
                            "Submit password button not found in the DOM"
                        );
                    }
                });
                await screenshot.takeScreenshot(page, "Password submitted");

                // Wait for JIT method selection card
                await page.waitForSelector("#jitMethodSelectionCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT method selection displayed"
                );

                // Create a new email account for JIT verification (different from sign-up email)
                const jitEmailClient = new MailTmClient(emailProviderPwd);
                const { address: jitEmail } =
                    await jitEmailClient.createInbox();
                await jitEmailClient.login(jitEmail, emailProviderPwd);

                // Select email OTP as JIT method
                const emailMethodValue = await selectJitMethod(page, "email");
                await page.select("#jitAuthMethodSelect", emailMethodValue);
                await screenshot.takeScreenshot(
                    page,
                    "Email OTP method selected"
                );

                // Enter verification contact (DIFFERENT email from sign-up)
                await page.type("#jitVerificationContact", jitEmail);
                await screenshot.takeScreenshot(
                    page,
                    "JIT different email entered"
                );

                // Click submit button
                await page.click("#submitJitMethodBtn");
                await screenshot.takeScreenshot(
                    page,
                    "JIT method submit button clicked"
                );

                // Wait for challenge card to appear (verification required scenario)
                await page.waitForSelector("#jitChallengeCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT challenge form displayed"
                );

                // Get OTP code for JIT verification from email
                const jitOtpCode = await jitEmailClient.readOtpCode();
                expect(jitOtpCode).toBeDefined();

                // Enter JIT OTP code
                await page.type("#jitChallengeCode", jitOtpCode!);
                await screenshot.takeScreenshot(page, "JIT OTP code entered");

                // Submit JIT challenge
                await page.click("#submitJitChallengeBtn");

                // Wait for authentication to complete
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        return authStatusBanner?.textContent?.includes(
                            "Signed in"
                        );
                    },
                    { timeout: 40000 }
                );
                await screenshot.takeScreenshot(
                    page,
                    "JIT verified - authentication successful"
                );

                // Verify tokens are in cache
                await verifyTokensInCache(BrowserCache);

                // No need to delete inbox, Mail.tm inboxes are ephemeral
            },
            AUTH_TIMEOUT
        );
    });

    describe("JIT Flow - Sign In + JIT Verification", () => {
        let screenshot: Screenshot;

        beforeEach(async () => {
            screenshot = new Screenshot(
                `${SCREENSHOT_BASE_FOLDER_NAME}/SignInWithJit`
            );

            // Use the configured username for sign-in
            username = getNativeAuthConfigValue(
                "native_auth.sign_in_email_password_username_mfa"
            );

            await page.goto(sampleHomeUrl + `?usePwdConfig=true&useMFA=true`);

            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it(
            "Sign in with existing account and complete JIT registration using OTP",
            async () => {
                await screenshot.takeScreenshot(page, "Page loaded");

                // PHASE 1: Create a new account but stop before completing MFA setup
                // This creates an account that exists but hasn't completed JIT registration
                const emailClient = new MailTmClient(emailProviderPwd);
                const { address: signUpEmail } =
                    await emailClient.createInbox();
                const newAccountEmail = signUpEmail;
                await emailClient.login(signUpEmail, emailProviderPwd);

                // Click navigation Sign Up button to show sign up card
                await page.click("#showSignUpBtn");
                await screenshot.takeScreenshot(
                    page,
                    "Sign up nav button clicked"
                );

                // Wait for sign up card to be visible
                await page.waitForSelector("#signUpCard", { visible: true });

                // Enter sign up details
                await page.type("#signUpFirstName", "TestFirstName");
                await page.type("#signUpLastName", "TestLastName");
                await page.type("#signUpUsername", newAccountEmail);
                await screenshot.takeScreenshot(
                    page,
                    "Sign up details entered"
                );

                // Click sign up button
                await page.evaluate(() => {
                    const signUpButton = document.getElementById("signUpBtn");
                    if (signUpButton) {
                        signUpButton.click();
                    }
                });
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
                await page.waitForSelector("#verificationCode", {
                    visible: true,
                });
                await page.type("#verificationCode", signUpOtpCode!);
                await screenshot.takeScreenshot(
                    page,
                    "Sign up OTP code entered"
                );

                // Submit OTP code
                await page.waitForSelector("#submitCodeBtn:enabled", {
                    visible: true,
                });
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitCodeBtn");
                    if (submitButton) {
                        submitButton.click();
                    }
                });
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
                await page.waitForSelector("#signUpPassword", {
                    visible: true,
                });
                await page.type("#signUpPassword", accountPwd);
                await screenshot.takeScreenshot(
                    page,
                    "Sign up password entered"
                );

                // Submit password - this completes sign up but doesn't set up MFA
                await page.waitForSelector("#submitSignUpPasswordBtn:enabled", {
                    visible: true,
                });
                await page.evaluate(() => {
                    const submitButton = document.getElementById(
                        "submitSignUpPasswordBtn"
                    );
                    if (submitButton) {
                        submitButton.click();
                    }
                });
                await screenshot.takeScreenshot(
                    page,
                    "Sign up password submitted"
                );

                // Account is now created but MFA not set up
                // Clear session to prepare for sign-in
                await page.evaluate(() => {
                    Object.assign({}, window.sessionStorage.clear());
                });
                await page.evaluate(() => {
                    Object.assign({}, window.localStorage.clear());
                });

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
                await page.click("#showSignInBtn");
                await screenshot.takeScreenshot(
                    page,
                    "Sign in nav button clicked"
                );

                // Wait for sign in card to be visible
                await page.waitForSelector("#signInCard", { visible: true });

                // Enter sign in details with the newly created account
                await page.type("#username", newAccountEmail);
                await screenshot.takeScreenshot(
                    page,
                    "Sign in details entered"
                );

                // Click sign in button
                await page.evaluate(() => {
                    const signInButton = document.getElementById("signInBtn");
                    if (signInButton) {
                        signInButton.click();
                    }
                });
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
                await page.waitForSelector("#signInPassword", {
                    visible: true,
                });
                await page.type("#signInPassword", accountPwd);
                await screenshot.takeScreenshot(page, "Password entered");

                // Submit password
                await page.waitForSelector("#submitPasswordBtn:enabled", {
                    visible: true,
                });
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitPasswordBtn");
                    if (submitButton) {
                        submitButton.click();
                    }
                });
                await screenshot.takeScreenshot(page, "Password submitted");

                // Wait for JIT method selection card - this proves JIT is triggered
                await page.waitForSelector("#jitMethodSelectionCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT method selection displayed"
                );

                // Use configured email for JIT verification
                const jitEmail = getNativeAuthConfigValue(
                    NATIVE_AUTH_CONFIG_KEYS.SIGN_IN_EMAIL_PASSWORD_USERNAME_MFA
                );
                // Create email client for configured JIT email
                const jitEmailClient = new MailTmClient(emailProviderPwd);
                await jitEmailClient.login(jitEmail, emailProviderPwd);

                // Select email OTP as JIT method
                const emailMethodValue = await selectJitMethod(page, "email");
                await page.select("#jitAuthMethodSelect", emailMethodValue);
                await screenshot.takeScreenshot(
                    page,
                    "Email OTP method selected"
                );

                // Enter the JIT email address
                await page.waitForSelector("#jitVerificationContact");
                await page.type("#jitVerificationContact", jitEmail);
                await screenshot.takeScreenshot(page, "JIT email entered");

                // Click submit button
                await page.click("#submitJitMethodBtn");
                await screenshot.takeScreenshot(
                    page,
                    "JIT method submit button clicked"
                );

                // Wait for challenge card to appear
                await page.waitForSelector("#jitChallengeCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "JIT challenge form displayed"
                );

                // Get OTP code for JIT verification from configured email
                const jitOtpCode = await jitEmailClient.readOtpCode();
                expect(jitOtpCode).toBeDefined();
                // Enter JIT OTP code
                await page.type("#jitChallengeCode", jitOtpCode!);
                await screenshot.takeScreenshot(page, "JIT OTP code entered");

                // Submit JIT challenge
                await page.click("#submitJitChallengeBtn");

                // Wait for authentication to complete
                await page.waitForFunction(
                    () => {
                        const authStatusBanner =
                            document.getElementById("authStatusBanner");
                        return authStatusBanner?.textContent?.includes(
                            "Signed in"
                        );
                    },
                    { timeout: 45000 }
                );
                await screenshot.takeScreenshot(
                    page,
                    "JIT verified - authentication successful"
                );

                // Verify tokens are in cache
                await verifyTokensInCache(BrowserCache);

                // No need to delete inbox, Mail.tm inboxes are ephemeral
            },
            AUTH_TIMEOUT
        );
    });
});
