/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable no-console -- E2E diagnostics report steps and HTTP status without credentials. */

import type * as puppeteer from "puppeteer";
import {
    BrowserCacheUtils,
    RETRY_TIMES,
    getBrowser,
    getHomeUrl,
    pcaInitializedPoller,
} from "e2e-test-utils";
import { ChildProcess } from "child_process";
import { createServer } from "net";
import { startCorsProxy, stopCorsProxy } from "./utils/proxyUtils";
import { MailTmClient } from "./utils/emailProviderUtils";
import {
    getNativeAuthConfigValue,
    getTenantInfo,
    nativeAuthConfig,
    negativeTestData,
    testConfig,
} from "./utils/configUtils";
import {
    BrowserStateUtils,
    TokenVerificationUtils,
    UIInteractionUtils,
} from "./utils/testUtils";

const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;

describe("Native Auth Sample - V2 Reset Password Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let browserCache: BrowserCacheUtils;
    let corsProcess: ChildProcess | undefined;
    let proxyPort: number;
    let resetPasswordUsername: string;
    let otpOnlyUsername: string;
    let emailProviderPwd: string;
    let resetPasswordClient: MailTmClient | undefined;
    let currentTestId = "";
    let startedAt = 0;
    let currentStep = "";

    function logStep(step: string): void {
        currentStep = step;
        console.log(`[${currentTestId}][+${Date.now() - startedAt}ms] ${step}`);
    }

    async function waitForStep(selector: string): Promise<void> {
        const handle = await page.waitForFunction(
            (target) => {
                const error = document.getElementById("errorBanner");
                if (error && getComputedStyle(error).display !== "none") {
                    return "rejected";
                }
                const element = document.querySelector(target);
                if (!element?.getClientRects().length) return false;
                if (
                    target === "#authStatusBanner" &&
                    !element.textContent?.includes("Signed in")
                ) {
                    return false;
                }
                return "ready";
            },
            { timeout: STANDARD_TIMEOUT },
            selector
        );
        const outcome = await handle.jsonValue();
        await handle.dispose();
        if (outcome === "rejected") {
            const message = await page.$eval(
                "#errorMessage",
                (element) => element.textContent
            );
            throw new Error(`[${currentTestId}] ${message}`);
        }
    }

    async function submitResetUsername(username: string): Promise<void> {
        logStep("Request password reset");
        await UIInteractionUtils.typeIntoElement(
            page,
            "#resetPasswordEmail",
            username,
            "Reset password email field"
        );
        await UIInteractionUtils.waitAndClick(
            page,
            "#resetPasswordBtn",
            "Reset password button",
            STANDARD_TIMEOUT
        );
    }

    async function reachNewPasswordStep(): Promise<void> {
        if (!resetPasswordClient) {
            logStep("Connect to the dedicated V2 reset mailbox");
            resetPasswordClient = await MailTmClient.connectToExistingAccount(
                resetPasswordUsername,
                emailProviderPwd
            );
        }
        resetPasswordClient.markCheckpoint();
        await submitResetUsername(resetPasswordUsername);
        logStep("Wait for reset OTP challenge");
        await waitForStep("#codeVerificationCard");
        logStep("Read reset OTP email");
        const code = await resetPasswordClient.readOtpCode();
        logStep("Submit reset OTP");
        await UIInteractionUtils.typeIntoElement(
            page,
            "#verificationCode",
            code,
            "OTP verification field",
            true
        );
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitCodeBtn",
            "Submit OTP button",
            STANDARD_TIMEOUT
        );
        logStep("Wait for new-password step");
        await waitForStep("#resetPasswordNewPasswordCard");
        await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
    }

    async function submitNewPassword(password: string): Promise<void> {
        logStep("Submit replacement password");
        await UIInteractionUtils.typeIntoElement(
            page,
            "#resetPasswordNewPassword",
            password,
            "New password field",
            true
        );
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitResetPasswordNewPasswordBtn",
            "Submit new password button",
            STANDARD_TIMEOUT
        );
    }

    async function expectRejection(message: string): Promise<void> {
        logStep("Wait for reset rejection");
        await page.waitForSelector("#errorBanner", { visible: true });
        expect(
            await page.$eval("#errorMessage", (element) => element.textContent)
        ).toContain(message);
        await BrowserStateUtils.verifyNotSignedIn(page);
        await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
        expect((await browserCache.getAccountFromCache()) ?? []).toHaveLength(
            0
        );
        logStep("Expected rejection and empty token cache verified");
    }

    beforeAll(async () => {
        resetPasswordUsername = getNativeAuthConfigValue(
            "native_auth.reset_password_username_v2"
        );
        otpOnlyUsername = getNativeAuthConfigValue(
            "native_auth.sign_in_email_code_username_v2"
        );
        emailProviderPwd = getNativeAuthConfigValue(
            "native_auth.password_provider_v2"
        );
        const passwordSignInUsername = getNativeAuthConfigValue(
            "native_auth.sign_in_email_password_username_v2"
        );
        if (
            [passwordSignInUsername, otpOnlyUsername].some(
                (username) =>
                    username.trim().toLowerCase() ===
                    resetPasswordUsername.trim().toLowerCase()
            )
        ) {
            throw new Error(
                "V2 password reset requires an account separate from both sign-in fixtures."
            );
        }
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
        browser = await getBrowser();
    });

    afterAll(() => {
        if (corsProcess) stopCorsProxy(corsProcess);
    });

    beforeEach(async () => {
        currentTestId =
            expect.getState().currentTestName?.match(/E2E-V2-RP-\d+/)?.[0] ??
            "V2-RP";
        startedAt = Date.now();
        logStep("Create isolated browser context");
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(STANDARD_TIMEOUT);
        browserCache = new BrowserCacheUtils(page, "sessionStorage");
        const testLabel = `[${currentTestId}]`;
        page.on("response", (response) => {
            const url = new URL(response.url());
            if (
                url.origin !== `http://localhost:${proxyPort}` ||
                !url.pathname.startsWith("/api/") ||
                response.status() < 400
            ) {
                return;
            }
            const action =
                [
                    "authorize-challenge",
                    "token",
                    "resetpassword",
                    "challenge",
                    "verify",
                    "update",
                    "poll",
                ].find((name) => url.pathname.endsWith(`/${name}`)) ??
                "native-auth action";
            console.warn(
                `${testLabel}[auth HTTP] ${action}: HTTP ${response.status()}`
            );
        });
        await page.setRequestInterception(true);
        page.on("request", async (request) => {
            const url = new URL(request.url());
            if (url.pathname === "/authConfig.js" && !url.search) {
                // Change only the proxy port; use the real SDK and configuration.
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
        logStep("Load V2 password configuration");
        await page.goto(`${getHomeUrl()}?apiVersion=v2&usePwdConfig=true`);
        await pcaInitializedPoller(page, AUTH_TIMEOUT);
        await BrowserStateUtils.verifyNotSignedIn(page);
        await UIInteractionUtils.waitAndClick(
            page,
            "#showResetPasswordBtn",
            "Show reset password button",
            STANDARD_TIMEOUT
        );
        await waitForStep("#resetPasswordCard");
    });

    afterEach(async () => {
        logStep(`End test; last recorded step: ${currentStep}`);
        try {
            if (page && !page.isClosed()) {
                await BrowserStateUtils.cleanupBrowserState(page);
            }
        } finally {
            await context?.close();
        }
    });

    describe("Reset Password Flow - Email + Password - Positive", () => {
        it(
            "E2E-V2-RP-01: User verifies email, sets a new password, completes reset and signs in",
            async () => {
                await reachNewPasswordStep();
                await submitNewPassword(
                    nativeAuthConfig.passwordSignInEmailCode
                );
                logStep("Wait for reset completion and continuation sign-in");
                await waitForStep("#authStatusBanner");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                expect(await browserCache.getAccountFromCache()).toHaveLength(
                    1
                );
                logStep(
                    "Password reset, signed-in account and tokens verified"
                );
            },
            AUTH_TIMEOUT
        );
    });

    describe("Reset Password Flow - Email + Password - Negative", () => {
        it(
            "E2E-V2-RP-02: User submits an unknown account and receives account-not-found",
            async () => {
                await submitResetUsername(negativeTestData.nonRegisteredEmail);
                await expectRejection("Account not found.");
            },
            AUTH_TIMEOUT
        );

        it(
            "E2E-V2-RP-03: User submits an OTP-only account and cannot reset a password",
            async () => {
                await submitResetUsername(otpOnlyUsername);
                await expectRejection(
                    "Password reset cannot continue natively for this account."
                );
            },
            AUTH_TIMEOUT
        );

        it(
            "E2E-V2-RP-05: User verifies email, submits a weak password and receives a password error",
            async () => {
                await reachNewPasswordStep();
                await submitNewPassword(negativeTestData.invalidPassword);
                await expectRejection("Invalid new password.");
            },
            AUTH_TIMEOUT
        );

        it(
            "E2E-V2-RP-04: User submits an incorrect reset code and receives a verification error",
            async () => {
                await submitResetUsername(resetPasswordUsername);
                logStep("Wait for reset OTP challenge");
                await waitForStep("#codeVerificationCard");
                logStep(
                    "Submit deliberately invalid OTP without reading email"
                );
                await UIInteractionUtils.typeIntoElement(
                    page,
                    "#verificationCode",
                    negativeTestData.invalidOtpCode,
                    "OTP verification field",
                    true
                );
                await UIInteractionUtils.waitAndClick(
                    page,
                    "#submitCodeBtn",
                    "Submit OTP button",
                    STANDARD_TIMEOUT
                );
                await expectRejection("Invalid verification code.");
            },
            AUTH_TIMEOUT
        );
    });
});
