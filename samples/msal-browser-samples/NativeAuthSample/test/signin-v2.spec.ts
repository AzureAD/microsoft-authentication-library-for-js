/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable no-console -- E2E step and retry diagnostics use the test runner console. */

import type * as puppeteer from "puppeteer";
import {
    Screenshot,
    createFolder,
    BrowserCacheUtils,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
    RETRY_TIMES,
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import { createServer } from "net";
import path = require("path");
import { startCorsProxy, stopCorsProxy } from "./utils/proxyUtils";
import { MailTmClient } from "./utils/emailProviderUtils";
import {
    testConfig,
    getTenantInfo,
    getNativeAuthConfigValue,
    negativeTestData,
    nativeAuthConfig,
} from "./utils/configUtils";
import {
    BrowserStateUtils,
    TokenVerificationUtils,
    UIInteractionUtils,
} from "./utils/testUtils";

const SCREENSHOT_BASE_FOLDER_NAME = path.join(
    __dirname,
    testConfig.screenshots.baseFolderName,
    "signin-v2"
);
const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const EXTENDED_TIMEOUT = testConfig.timeouts.extended;
const AUTH_TIMEOUT = testConfig.timeouts.auth;

describe("Native Auth Sample - V2 Sign In Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let corsProcess: ChildProcess | undefined;
    let proxyPort: number;
    let browserCache: BrowserCacheUtils;
    let emailOtpClient: MailTmClient;
    let sampleHomeUrl = "";
    let signInEmailUsername = "";
    let signInEmailOtpUsername = "";
    let accountPwd = "";
    let emailProviderPwd = "";
    const testAttempts = new Map<string, number>();
    let currentTestId = "";
    let currentAttempt = 0;
    let attemptStartedAt = 0;
    let currentStep = "";

    function logStep(step: string): void {
        currentStep = step;
        console.log(
            `[${currentTestId}][test attempt ${currentAttempt}/${
                RETRY_TIMES + 1
            }][+${Date.now() - attemptStartedAt}ms] ${step}`
        );
    }

    async function waitForSignInCompletion(): Promise<void> {
        const result = await page.waitForFunction(
            () => {
                const errorBanner = document.getElementById("errorBanner");
                if (
                    errorBanner &&
                    getComputedStyle(errorBanner).display !== "none"
                ) {
                    const message =
                        document.getElementById("errorMessage")?.textContent ??
                        "";
                    if (message.includes("Invalid verification code.")) {
                        return "invalid_code";
                    }
                    if (message.includes("Unable to complete V2 sign-in.")) {
                        return "operation_exception";
                    }
                    return "sign_in_error";
                }
                return document
                    .getElementById("authStatusBanner")
                    ?.textContent?.includes("Signed in")
                    ? "completed"
                    : false;
            },
            { timeout: STANDARD_TIMEOUT }
        );
        const outcome = await result.jsonValue();
        await result.dispose();
        if (outcome !== "completed") {
            logStep(`Authentication rejected (${outcome})`);
            throw new Error(
                `[${currentTestId}] V2 sign-in rejected: ${outcome}. See auth HTTP diagnostics for failed requests.`
            );
        }
    }

    beforeAll(async () => {
        await new Promise<void>((resolve, reject) => {
            const probe = createServer();
            probe.once("error", reject);
            probe.listen(0, () => {
                const address = probe.address();
                if (!address || typeof address === "string") {
                    probe.close(() =>
                        reject(
                            new Error("Could not allocate a test proxy port.")
                        )
                    );
                    return;
                }
                proxyPort = address.port;
                probe.close((error) => (error ? reject(error) : resolve()));
            });
        });
        const tenant = getTenantInfo();
        corsProcess = await startCorsProxy(tenant.name, tenant.id, proxyPort);
        if (corsProcess.exitCode !== null) {
            throw new Error("The test-owned CORS proxy did not start.");
        }
        if (testConfig.screenshots.enabled) {
            createFolder(SCREENSHOT_BASE_FOLDER_NAME);
        }
        browser = await getBrowser();
        sampleHomeUrl = getHomeUrl();
        signInEmailUsername = getNativeAuthConfigValue(
            "native_auth.sign_in_email_password_username_v2"
        );
        signInEmailOtpUsername = getNativeAuthConfigValue(
            "native_auth.sign_in_email_code_username_v2"
        );
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
        emailProviderPwd = getNativeAuthConfigValue(
            "native_auth.password_provider_v2"
        );
    });

    afterAll(() => {
        if (corsProcess) {
            stopCorsProxy(corsProcess);
        }
    });

    beforeEach(async () => {
        currentTestId =
            expect.getState().currentTestName?.match(/E2E-V2-SI-\d+/)?.[0] ??
            "V2-SI";
        currentAttempt = (testAttempts.get(currentTestId) ?? 0) + 1;
        testAttempts.set(currentTestId, currentAttempt);
        attemptStartedAt = Date.now();
        logStep("Create isolated browser context");
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(STANDARD_TIMEOUT);
        browserCache = new BrowserCacheUtils(page, "sessionStorage");
        const attemptLabel = `[${currentTestId}][test attempt ${currentAttempt}/${
            RETRY_TIMES + 1
        }]`;
        page.on("response", (response) => {
            const url = new URL(response.url());
            if (
                url.origin === `http://localhost:${proxyPort}` &&
                url.pathname.startsWith("/api/") &&
                response.status() >= 400
            ) {
                const endpoint = url.pathname.endsWith("/authorize-challenge")
                    ? "authorize-challenge"
                    : url.pathname.endsWith("/token")
                    ? "token"
                    : "native-auth action";
                console.warn(
                    `${attemptLabel}[auth HTTP] ${endpoint}: HTTP ${response.status()}`
                );
            }
        });
        await page.setRequestInterception(true);
        page.on("request", async (request) => {
            const url = new URL(request.url());
            if (url.pathname === "/authConfig.js" && !url.search) {
                // Change only the proxy port; keep the real SDK, configuration and endpoints.
                await request.respond({
                    contentType: "application/javascript",
                    body: `
                        import { initMsalConfig as init } from "./authConfig.js?live-v2";
                        export async function initMsalConfig() {
                            const config = await init();
                            config.customAuth.authApiProxyUrl = "http://localhost:${proxyPort}/api";
                            return config;
                        }
                    `,
                });
            } else {
                await request.continue();
            }
        });
    });

    afterEach(async () => {
        logStep(`End test attempt; last recorded step: ${currentStep}`);
        if (page && !page.isClosed()) {
            await BrowserStateUtils.cleanupBrowserState(page);
        }
        await context?.close();
    });

    describe("Sign In Flow - Email + Password - Positive", () => {
        beforeEach(async () => {
            logStep(
                "Load password configuration and wait for SDK initialization"
            );
            await page.goto(`${sampleHomeUrl}?apiVersion=v2&usePwdConfig=true`);
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
            logStep("Verify signed-out state and open sign-in form");
            await BrowserStateUtils.verifyNotSignedIn(page);
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignInBtn",
                "Show sign in button",
                STANDARD_TIMEOUT
            );
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "E2E-V2-SI-01: User inputs registered email and password, signs in successfully",
            async () => {
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/signInFormDisplay`
                );
                logStep("Submit registered username");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailUsername,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for password prompt");
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(page, "passwordInputDisplayed");
                logStep("Submit password");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#signInPassword",
                    accountPwd,
                    "Password field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitPasswordBtn",
                    "Submit password button",
                    STANDARD_TIMEOUT
                );
                logStep(
                    `Wait for authentication completion (${STANDARD_TIMEOUT}ms timeout)`
                );
                await waitForSignInCompletion();
                logStep("Verify account, tokens and scopes");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                await screenshot.takeScreenshot(page, "signInSuccessful");
                logStep("Sign-in assertions passed");
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + Password - Negative", () => {
        beforeEach(async () => {
            logStep(
                "Load password configuration and wait for SDK initialization"
            );
            await page.goto(`${sampleHomeUrl}?apiVersion=v2&usePwdConfig=true`);
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
            logStep("Verify signed-out state and open sign-in form");
            await BrowserStateUtils.verifyNotSignedIn(page);
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignInBtn",
                "Show sign in button",
                STANDARD_TIMEOUT
            );
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "E2E-V2-SI-02: User inputs non-registered email, receives account not found error",
            async () => {
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/signInWithNonRegisteredUsername`
                );
                logStep("Submit unregistered username");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    negativeTestData.nonRegisteredEmail,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for account-not-found error");
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("Account not found.");
                await BrowserStateUtils.verifyNotSignedIn(page);
                await TokenVerificationUtils.verifyNoTokensInCache(
                    browserCache
                );
                logStep("Account-not-found and empty-cache assertions passed");
            },
            AUTH_TIMEOUT
        );

        it(
            "E2E-V2-SI-03: User inputs registered email, provides incorrect password, receives error",
            async () => {
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/signInWithIncorrectPassword`
                );
                logStep("Submit registered username");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailUsername,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for password prompt");
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                });
                logStep("Submit incorrect password");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#signInPassword",
                    negativeTestData.incorrectPassword,
                    "Password field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitPasswordBtn",
                    "Submit password button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for invalid-password error");
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("Invalid password.");
                await BrowserStateUtils.verifyNotSignedIn(page);
                await TokenVerificationUtils.verifyNoTokensInCache(
                    browserCache
                );
                logStep("Invalid-password and empty-cache assertions passed");
            },
            AUTH_TIMEOUT
        );

        it(
            "E2E-V2-SI-04: User signs in with account A when account A has already signed in",
            async () => {
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/signInFormErrorWithSameAccount`
                );
                logStep("Submit registered username for initial sign-in");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailUsername,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for password prompt");
                await page.waitForSelector("#passwordInputCard", {
                    visible: true,
                });
                logStep("Submit password");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#signInPassword",
                    accountPwd,
                    "Password field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitPasswordBtn",
                    "Submit password button",
                    STANDARD_TIMEOUT
                );
                logStep(
                    `Wait for initial authentication completion (${STANDARD_TIMEOUT}ms timeout)`
                );
                await waitForSignInCompletion();
                logStep("Verify initial account, tokens and scopes");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                logStep("Attempt sign-in again with the same account");
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#showSignInBtn",
                    "Show sign in button",
                    STANDARD_TIMEOUT
                );
                await page.waitForSelector("#signInCard", { visible: true });
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailUsername,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for already-signed-in error");
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("already signed in");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                logStep(
                    "Already-signed-in and preserved-cache assertions passed"
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Sign In Flow - Email + OTP - Positive", () => {
        beforeAll(async () => {
            console.log("[V2-SI][OTP setup] Connect to existing mailbox");
            emailOtpClient = await MailTmClient.connectToExistingAccount(
                signInEmailOtpUsername,
                emailProviderPwd
            );
            console.log("[V2-SI][OTP setup] Mailbox connection ready");
        });

        beforeEach(async () => {
            logStep("Load OTP configuration and wait for SDK initialization");
            await page.goto(`${sampleHomeUrl}?apiVersion=v2&useOtpConfig=true`);
            await pcaInitializedPoller(page, AUTH_TIMEOUT);
            logStep("Verify signed-out state and open sign-in form");
            await BrowserStateUtils.verifyNotSignedIn(page);
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignInBtn",
                "Show sign in button",
                STANDARD_TIMEOUT
            );
            await page.waitForSelector("#signInCard", { visible: true });
        });

        it(
            "E2E-V2-SI-05: User inputs registered email, then receives OTP, verifies successfully",
            async () => {
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/emailOtpSignInSuccessful`
                );
                logStep("Request initial OTP");
                emailOtpClient.markCheckpoint();
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailOtpUsername,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for OTP challenge");
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                await screenshot.takeScreenshot(page, "otpInputDisplayed");
                logStep("Read initial OTP email");
                const otpCode = await emailOtpClient.readOtpCode(
                    undefined,
                    `${currentTestId}/test-attempt-${currentAttempt}/initial-OTP`
                );
                logStep("Submit received OTP");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#verificationCode",
                    otpCode,
                    "OTP verification code field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitCodeBtn",
                    "Submit OTP button",
                    STANDARD_TIMEOUT
                );
                logStep(
                    `Wait for authentication completion (${STANDARD_TIMEOUT}ms timeout)`
                );
                await waitForSignInCompletion();
                logStep("Verify account, tokens and scopes");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                await screenshot.takeScreenshot(page, "signInSuccessful");
                logStep("OTP sign-in assertions passed");
            },
            AUTH_TIMEOUT
        );

        it(
            "E2E-V2-SI-06: User inputs registered email, enters incorrect OTP code, requests new OTP, enters valid code, signs in successfully",
            async () => {
                const screenshot = new Screenshot(
                    `${SCREENSHOT_BASE_FOLDER_NAME}/emailOtpSignInWithRetry`
                );
                logStep("Request initial OTP");
                emailOtpClient.markCheckpoint();
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#username",
                    signInEmailOtpUsername,
                    "Username field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#signInBtn",
                    "Sign in button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for OTP challenge");
                await page.waitForSelector("#codeVerificationCard", {
                    visible: true,
                });
                // Drain the first delivery so it cannot be mistaken for the resent code.
                logStep("Read and discard initial OTP email before resend");
                await emailOtpClient.readOtpCode(
                    undefined,
                    `${currentTestId}/test-attempt-${currentAttempt}/initial-OTP-drain`
                );
                logStep("Submit deliberately invalid OTP");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#verificationCode",
                    negativeTestData.invalidOtpCode,
                    "OTP verification code field"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitCodeBtn",
                    "Submit OTP button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for invalid-OTP error");
                await page.waitForSelector("#errorBanner", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await screenshot.takeScreenshot(page, "errorBannerDisplayed");
                const errorMessage = await page.$eval(
                    "#errorMessage",
                    (el) => el.textContent
                );
                expect(errorMessage).toContain("Invalid verification code.");
                await BrowserStateUtils.verifyNotSignedIn(page);
                await TokenVerificationUtils.verifyNoTokensInCache(
                    browserCache
                );
                logStep(
                    "Invalid-OTP and empty-cache assertions passed; dismiss error"
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#dismissErrorBtn",
                    "Dismiss error button",
                    STANDARD_TIMEOUT
                );
                logStep("Request replacement OTP");
                emailOtpClient.markCheckpoint();
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#resendCodeBtn",
                    "Resend code button",
                    STANDARD_TIMEOUT
                );
                logStep("Wait for resend completion");
                await page.waitForSelector("#resendCodeBtn:enabled", {
                    visible: true,
                    timeout: STANDARD_TIMEOUT,
                });
                await page.waitForSelector("#errorBanner", { hidden: true });
                logStep("Read replacement OTP email");
                const otpCode = await emailOtpClient.readOtpCode(
                    undefined,
                    `${currentTestId}/test-attempt-${currentAttempt}/replacement-OTP`
                );
                logStep("Submit replacement OTP");
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#verificationCode",
                    otpCode,
                    "OTP verification code field",
                    true
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitCodeBtn",
                    "Submit OTP button",
                    EXTENDED_TIMEOUT
                );
                logStep(
                    `Wait for authentication completion (${STANDARD_TIMEOUT}ms timeout)`
                );
                await waitForSignInCompletion();
                logStep("Verify account, tokens and scopes");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                await screenshot.takeScreenshot(page, "signInSuccessful");
                logStep("OTP resend/recovery assertions passed");
            },
            AUTH_TIMEOUT
        );
    });
});
