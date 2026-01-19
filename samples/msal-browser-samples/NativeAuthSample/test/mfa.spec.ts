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
    "/mfa"
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
 * Select MFA authentication method by finding option with matching text
 * @param page - Puppeteer page instance
 * @param methodType - Type of method to select ("email" or "sms")
 * @returns The value of the selected option
 */
async function selectMfaMethod(
    page: puppeteer.Page,
    methodType: "email" | "sms"
): Promise<string> {
    const methodValue = await page.evaluate((type) => {
        const select = document.getElementById(
            "mfaAuthMethodSelect"
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
    console.log(`Found ${methodType} MFA method with value: ${methodValue}`);

    return methodValue!;
}

describe("Native Auth Sample - MFA Tests", () => {
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let BrowserCache: BrowserCacheUtils;
    let browser: puppeteer.Browser;
    let username: string = "";
    let emailProviderPwd: string = "";
    let accountPwd: string = "";
    let corsProcess: ChildProcess;
    let emailClient: MailTmClient;

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

        // Use configured MFA account
        username = getNativeAuthConfigValue(
            NATIVE_AUTH_CONFIG_KEYS.SIGN_IN_EMAIL_PASSWORD_USERNAME_MFA
        );
        emailProviderPwd = getNativeAuthConfigValue(
            NATIVE_AUTH_CONFIG_KEYS.PASSWORD_PROVIDER
        );
        accountPwd = getNativeAuthConfigValue(
            NATIVE_AUTH_CONFIG_KEYS.PASSWORD_SIGN_IN_EMAIL_CODE
        );

        // Initialize email client for MFA account
        emailClient = new MailTmClient();
        await emailClient.login(username, emailProviderPwd);
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
        page.on("console", (msg) => {
            const type = msg.type();
            const text = msg.text();
            console.log(`[Browser ${type}]:`, text);
        });
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

    describe("MFA Flow - Sign In + MFA Verification", () => {
        let screenshot: Screenshot;

        beforeEach(async () => {
            await page.goto(sampleHomeUrl + `?usePwdConfig=true&useMFA=true`);
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
        });

        it(
            "Sign in with email/password and complete MFA verification using OTP",
            async () => {
                screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/SignInWithMfa`
                );
                await screenshot.takeScreenshot(page, "Page loaded");

                // Click navigation Sign In button to show sign in card
                await page.click("#showSignInBtn");
                await screenshot.takeScreenshot(
                    page,
                    "Sign in nav button clicked"
                );

                // Wait for sign in card to be visible
                await page.waitForSelector("#signInCard", { visible: true });

                // Enter sign in details
                await page.type("#username", username);
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

                // Wait for MFA method selection card to appear
                await page.waitForSelector("#mfaMethodSelectionCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "MFA method selection displayed"
                );

                // Select Email MFA method
                const emailOptionValue = await selectMfaMethod(page, "email");
                await page.select("#mfaAuthMethodSelect", emailOptionValue);
                await screenshot.takeScreenshot(
                    page,
                    "Email OTP method selected"
                );

                // Submit MFA method selection
                await page.evaluate(() => {
                    const submitButton =
                        document.getElementById("submitMfaMethodBtn");
                    if (submitButton) {
                        submitButton.click();
                    }
                });
                await screenshot.takeScreenshot(page, "MFA method submitted");

                // Wait for MFA challenge card to appear
                await page.waitForSelector("#mfaChallengeCard", {
                    visible: true,
                    timeout: 45000,
                });
                await screenshot.takeScreenshot(
                    page,
                    "MFA challenge form displayed"
                );

                // Get OTP code for MFA verification from email
                const mfaOtpCode = await emailClient.readOtpCode();
                expect(mfaOtpCode).toBeDefined();
                console.log(`MFA OTP code received: ${mfaOtpCode}`);

                // Enter MFA OTP code
                await page.type("#mfaChallengeCode", mfaOtpCode!);
                await screenshot.takeScreenshot(page, "MFA OTP code entered");

                // Submit MFA challenge
                await page.click("#submitMfaChallengeBtn");

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
                    "MFA verified - authentication successful"
                );

                // Verify tokens are in cache
                await verifyTokensInCache(BrowserCache);
            },
            AUTH_TIMEOUT
        );
    });
});
