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
type SignUpKind = "password" | "otp";
type SignUpStep = "password" | "attributes" | "completed";
type UpfrontProfile = "names" | "city" | "none";

describe("Native Auth Sample - V2 Sign Up Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let browserCache: BrowserCacheUtils;
    let corsProcess: ChildProcess | undefined;
    let proxyPort: number;
    let emailProviderPwd: string;
    let existingPasswordUsername: string;
    let authRequestCount = 0;
    let currentTestId = "";
    let startedAt = 0;
    let currentStep = "";
    let pendingAuthErrorLogs: Promise<void>[] = [];

    function logStep(step: string): void {
        currentStep = step;
        console.log(`[${currentTestId}][+${Date.now() - startedAt}ms] ${step}`);
    }

    function isRecord(value: unknown): value is Record<string, unknown> {
        return (
            typeof value === "object" && value !== null && !Array.isArray(value)
        );
    }

    function logSignUpAttributes(
        request: puppeteer.HTTPRequest,
        label: string
    ): void {
        try {
            const payload: unknown = JSON.parse(request.postData() ?? "null");
            if (!isRecord(payload) || !("attributes" in payload)) {
                console.warn(
                    `${label}[auth attributes] No attributes field in the JSON request.`
                );
                return;
            }
            console.log(
                `${label}[auth attributes] ${JSON.stringify(
                    payload.attributes,
                    (key: string, value: unknown): unknown =>
                        [
                            "password",
                            "email",
                            "username",
                            "continuationtoken",
                        ].includes(key.toLowerCase())
                            ? "[REDACTED]"
                            : value
                )}`
            );
        } catch {
            console.warn(
                `${label}[auth attributes] Unable to read the JSON attributes; request will continue unchanged.`
            );
        }
    }

    async function logAuthError(
        response: puppeteer.HTTPResponse,
        label: string
    ): Promise<void> {
        try {
            const payload: unknown = await response.json();
            if (!isRecord(payload) || !("error" in payload)) {
                console.warn(
                    `${label}[auth error] No error field in the JSON response.`
                );
                return;
            }
            console.warn(
                `${label}[auth error] ${JSON.stringify(payload.error)}`
            );
        } catch {
            console.warn(
                `${label}[auth error] Unable to read the JSON error; original HTTP failure is preserved.`
            );
        }
    }

    async function waitForStep(
        targets: Record<string, string>
    ): Promise<string> {
        const handle = await page.waitForFunction(
            (selectors) => {
                if (
                    [
                        "signUpBtn",
                        "submitSignUpPasswordBtn",
                        "submitSignUpAttributesBtn",
                        "submitCodeBtn",
                        "resendCodeBtn",
                        "submitMfaMethodBtn",
                    ].some((id) => {
                        const button = document.getElementById(id);
                        return (
                            button instanceof HTMLButtonElement &&
                            button.disabled
                        );
                    })
                ) {
                    return false;
                }
                const error = document.getElementById("errorBanner");
                if (error && getComputedStyle(error).display !== "none") {
                    return "rejected";
                }
                for (const [step, selector] of Object.entries(selectors)) {
                    const element = document.querySelector(selector);
                    if (!element?.getClientRects().length) continue;
                    if (
                        step === "completed" &&
                        !element.textContent?.includes("Signed in")
                    ) {
                        continue;
                    }
                    return step;
                }
                return false;
            },
            { timeout: STANDARD_TIMEOUT },
            targets
        );
        const outcome: unknown = await handle.jsonValue();
        await handle.dispose();
        if (outcome === "rejected") {
            await Promise.all(pendingAuthErrorLogs);
            const message = await page.$eval(
                "#errorMessage",
                (element) => element.textContent
            );
            throw new Error(`[${currentTestId}] ${message}`);
        }
        if (typeof outcome !== "string") {
            throw new Error("Sign-up did not reach a supported step.");
        }
        return outcome;
    }

    async function waitForSignUpStep(): Promise<SignUpStep> {
        const step = await waitForStep({
            password: "#signUpPasswordCard",
            attributes: "#signUpAttributesCard",
            completed: "#authStatusBanner",
        });
        if (
            step !== "password" &&
            step !== "attributes" &&
            step !== "completed"
        ) {
            throw new Error("Sign-up returned an unexpected step.");
        }
        return step;
    }

    async function openSignUp(kind: SignUpKind): Promise<void> {
        const query =
            kind === "password"
                ? "usePwdAttributesConfig=true"
                : "useOtpAttributesConfig=true";
        logStep(`Load V2 ${kind} configuration with required city/country`);
        await page.goto(`${getHomeUrl()}?apiVersion=v2&${query}`);
        await pcaInitializedPoller(page, AUTH_TIMEOUT);
        await BrowserStateUtils.verifyNotSignedIn(page);
        await UIInteractionUtils.waitAndClick(
            page,
            "#showSignUpBtn",
            "Show sign-up button",
            STANDARD_TIMEOUT
        );
        await waitForStep({ start: "#signUpCard" });
        expect(
            await page.$$eval(
                "#signUpForm input:not([name='username'])",
                (inputs) =>
                    inputs.every(
                        (input) =>
                            input instanceof HTMLInputElement && !input.required
                    )
            )
        ).toBe(true);
    }

    async function submitUsername(
        username: string,
        upfrontProfile: UpfrontProfile = "names"
    ): Promise<void> {
        if (upfrontProfile === "names") {
            await UIInteractionUtils.typeIntoElement(
                page,
                "#signUpFirstName",
                "TestFirstName",
                "Optional first name"
            );
            await UIInteractionUtils.typeIntoElement(
                page,
                "#signUpLastName",
                "TestLastName",
                "Optional last name"
            );
        } else if (upfrontProfile === "city") {
            await UIInteractionUtils.typeIntoElement(
                page,
                "#signUpCity",
                "Redmond",
                "Upfront city"
            );
        }
        await UIInteractionUtils.typeIntoElement(
            page,
            "#signUpUsername",
            username,
            "Sign-up email"
        );
        logStep(`Start signup with upfront profile: ${upfrontProfile}`);
        await UIInteractionUtils.waitAndClick(
            page,
            "#signUpBtn",
            "Sign-up button",
            STANDARD_TIMEOUT
        );
    }

    async function submitCode(code: string): Promise<void> {
        logStep("Submit signup verification code");
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
    }

    async function expectRejection(message: string): Promise<void> {
        await page.waitForSelector("#errorBanner", { visible: true });
        expect(
            await page.$eval("#errorMessage", (element) => element.textContent)
        ).toContain(message);
        await BrowserStateUtils.verifyNotSignedIn(page);
        await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
        expect((await browserCache.getAccountFromCache()) ?? []).toHaveLength(
            0
        );
        logStep("Expected rejection and empty token/account cache verified");
    }

    async function startNewAccount(
        kind: SignUpKind,
        recoverCode = false,
        upfrontProfile: UpfrontProfile = "names"
    ): Promise<void> {
        await openSignUp(kind);
        logStep("Create a fresh signup mailbox");
        const { client, address } =
            await MailTmClient.createAuthenticatedAccount(emailProviderPwd);
        client.markCheckpoint();
        await submitUsername(address, upfrontProfile);
        await waitForStep({ code: "#codeVerificationCard" });
        logStep("Read signup OTP email");
        const firstCode = await client.readOtpCode();
        if (recoverCode) {
            await submitCode(negativeTestData.invalidOtpCode);
            await expectRejection("Invalid verification code.");
            await page.waitForFunction(() => {
                const button = document.getElementById("submitCodeBtn");
                return button instanceof HTMLButtonElement && !button.disabled;
            });
            client.markCheckpoint();
            logStep("Request replacement signup code");
            await UIInteractionUtils.waitAndClick(
                page,
                "#resendCodeBtn",
                "Resend code button",
                STANDARD_TIMEOUT
            );
            await page.waitForFunction(() => {
                const button = document.getElementById("resendCodeBtn");
                return button instanceof HTMLButtonElement && !button.disabled;
            });
            logStep("Read replacement OTP email");
            await submitCode(await client.readOtpCode());
        } else {
            await submitCode(firstCode);
        }
    }

    async function submitPassword(password: string): Promise<void> {
        logStep("Submit requested password");
        await UIInteractionUtils.typeIntoElement(
            page,
            "#signUpPassword",
            password,
            "Sign-up password",
            true
        );
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitSignUpPasswordBtn",
            "Submit sign-up password",
            STANDARD_TIMEOUT
        );
    }

    async function submitAttributes(
        omitCity = false,
        requiredAttributes: readonly string[] = ["city", "country"]
    ): Promise<void> {
        logStep("Check SDK-generated required profile fields");
        const fields = await page.$$eval(
            "#signUpAttributeFields input",
            (inputs) =>
                inputs.map((input) => {
                    if (!(input instanceof HTMLInputElement)) {
                        throw new Error("Expected an attribute input.");
                    }
                    return {
                        name: input.name,
                        required: input.required,
                    };
                })
        );
        expect(
            fields
                .filter((field) => field.required)
                .map((field) => field.name)
                .sort()
        ).toEqual(requiredAttributes);
        if (!omitCity && requiredAttributes.includes("city")) {
            await UIInteractionUtils.typeIntoElement(
                page,
                "#signUpAttributeFields input[name='city']",
                "Redmond",
                "Requested city"
            );
        }
        await UIInteractionUtils.typeIntoElement(
            page,
            "#signUpAttributeFields input[name='country']",
            "United States",
            "Requested country"
        );
        logStep("Submit requested attributes");
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitSignUpAttributesBtn",
            "Submit attributes",
            STANDARD_TIMEOUT
        );
    }

    async function completeNewAccount(
        kind: SignUpKind,
        requiredAttributes?: readonly string[]
    ): Promise<void> {
        let submittedAttributes = false;
        let submittedPassword = false;
        for (let count = 0; count < 3; count++) {
            const step = await waitForSignUpStep();
            if (step === "completed") {
                expect(submittedAttributes).toBe(true);
                expect(submittedPassword).toBe(kind === "password");
                await TokenVerificationUtils.verifySuccessfulAuthentication(
                    browserCache
                );
                expect(await browserCache.getAccountFromCache()).toHaveLength(
                    1
                );
                logStep("Signup, continuation sign-in and tokens verified");
                return;
            }
            await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
            if (step === "attributes") {
                expect(submittedAttributes).toBe(false);
                submittedAttributes = true;
                await submitAttributes(false, requiredAttributes);
            } else {
                expect(kind).toBe("password");
                expect(submittedPassword).toBe(false);
                submittedPassword = true;
                await submitPassword(nativeAuthConfig.passwordSignInEmailCode);
            }
        }
        throw new Error(
            "Signup did not complete after password and attributes."
        );
    }

    async function authenticateExistingAccount(): Promise<void> {
        await openSignUp("password");
        await submitUsername(existingPasswordUsername);
        const step = await waitForStep({
            password: "#signUpPasswordCard",
            method: "#mfaMethodSelectionCard",
        });
        if (step === "method") {
            await page.select(
                "#mfaAuthMethodSelect",
                await page.$eval("#mfaAuthMethodSelect", (select) => {
                    if (!(select instanceof HTMLSelectElement)) {
                        throw new Error("Expected authentication methods.");
                    }
                    const password = Array.from(select.options).find((option) =>
                        option.textContent?.toLowerCase().startsWith("password")
                    );
                    if (!password) {
                        throw new Error(
                            "No password authentication method was offered."
                        );
                    }
                    return password.value;
                })
            );
            await UIInteractionUtils.waitAndClick(
                page,
                "#submitMfaMethodBtn",
                "Select existing password method",
                STANDARD_TIMEOUT
            );
            await waitForStep({ password: "#signUpPasswordCard" });
        }
        expect(
            await page.$eval(
                "#signUpPasswordInstructions",
                (element) => element.textContent
            )
        ).toContain("existing password");
        await submitPassword(nativeAuthConfig.passwordSignInEmailCode);
        await waitForStep({ completed: "#authStatusBanner" });
        await TokenVerificationUtils.verifySuccessfulAuthentication(
            browserCache
        );
        expect(await browserCache.getAccountFromCache()).toHaveLength(1);
        expect(
            await page.$$eval(
                "#signUpAttributeFields input",
                (inputs) => inputs.length
            )
        ).toBe(0);
        logStep("Existing account authenticated without profile collection");
    }

    beforeAll(async () => {
        emailProviderPwd = getNativeAuthConfigValue(
            "native_auth.password_provider_v2"
        );
        existingPasswordUsername = getNativeAuthConfigValue(
            "native_auth.sign_in_email_password_username_v2"
        );
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
            expect.getState().currentTestName?.match(/E2E-V2-SU-\d+/)?.[0] ??
            "V2-SU";
        startedAt = Date.now();
        authRequestCount = 0;
        pendingAuthErrorLogs = [];
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
                    "start",
                    "verify",
                    "challenge",
                    "resend",
                    "submitattributes",
                    "submitpassword",
                    "continue",
                    "token",
                ].find((name) => url.pathname.endsWith(`/${name}`)) ??
                "native-auth action";
            console.warn(
                `${testLabel}[auth HTTP] ${action}: HTTP ${response.status()}`
            );
            if (response.status() === 400) {
                pendingAuthErrorLogs.push(logAuthError(response, testLabel));
            }
        });
        await page.setRequestInterception(true);
        page.on("request", async (request) => {
            const url = new URL(request.url());
            if (
                url.origin === `http://localhost:${proxyPort}` &&
                url.pathname.startsWith("/api/")
            ) {
                authRequestCount++;
                if (
                    request.method() === "POST" &&
                    url.pathname.endsWith("/submitattributes")
                ) {
                    logSignUpAttributes(request, testLabel);
                }
            }
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
    });

    afterEach(async () => {
        logStep(`End test; last recorded step: ${currentStep}`);
        try {
            await Promise.all(pendingAuthErrorLogs);
            if (page && !page.isClosed()) {
                await BrowserStateUtils.cleanupBrowserState(page);
            }
        } finally {
            await context?.close();
        }
    });

    it(
        "E2E-V2-SU-01: New password account submits only city upfront and required country later",
        async () => {
            await startNewAccount("password", false, "city");
            await completeNewAccount("password", ["country"]);
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-02: Password signup recovers from an incorrect OTP through resend",
        async () => {
            await startNewAccount("password", true, "city");
            await completeNewAccount("password", ["country"]);
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-03: Invalid-format email cannot start signup",
        async () => {
            await openSignUp("password");
            const requests = authRequestCount;
            await submitUsername("not-an-email");
            expect(
                await page.$eval("#signUpUsername", (input) => {
                    if (!(input instanceof HTMLInputElement)) {
                        throw new Error("Expected the email input.");
                    }
                    return input.validity.typeMismatch;
                })
            ).toBe(true);
            expect(authRequestCount).toBe(requests);
            await BrowserStateUtils.verifyNotSignedIn(page);
            await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
            expect(
                (await browserCache.getAccountFromCache()) ?? []
            ).toHaveLength(0);
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-04: Signup with an existing password account authenticates without creating a new profile",
        async () => {
            await authenticateExistingAccount();
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-05: Incorrect signup OTP is rejected without authentication",
        async () => {
            await openSignUp("password");
            const { address } = await MailTmClient.createAuthenticatedAccount(
                emailProviderPwd
            );
            await submitUsername(address);
            await waitForStep({ code: "#codeVerificationCard" });
            await submitCode(negativeTestData.invalidOtpCode);
            await expectRejection("Invalid verification code.");
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-06: Invalid new password is rejected without authentication",
        async () => {
            await startNewAccount("password", false, "city");
            await waitForStep({ password: "#signUpPasswordCard" });
            await submitPassword(negativeTestData.invalidPassword);
            await expectRejection("Invalid new password.");
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-07: Signup while signed in is rejected and preserves the existing session",
        async () => {
            await authenticateExistingAccount();
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignUpBtn",
                "Show sign-up button",
                STANDARD_TIMEOUT
            );
            const requests = authRequestCount;
            await submitUsername(existingPasswordUsername, "none");
            await page.waitForSelector("#errorBanner", { visible: true });
            expect(
                await page.$eval(
                    "#errorMessage",
                    (element) => element.textContent
                )
            ).toContain("You are already signed in.");
            expect(authRequestCount).toBe(requests);
            await TokenVerificationUtils.verifySuccessfulAuthentication(
                browserCache
            );
            expect(await browserCache.getAccountFromCache()).toHaveLength(1);
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-08: New OTP account leaves optional names empty and submits required city/country",
        async () => {
            await startNewAccount("otp", false, "none");
            await completeNewAccount("otp");
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-09: OTP signup recovers from an incorrect code through resend",
        async () => {
            await startNewAccount("otp", true, "none");
            await completeNewAccount("otp");
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-SU-10: Missing required city prevents attribute submission without issuing tokens",
        async () => {
            await startNewAccount("otp", false, "none");
            await waitForStep({ attributes: "#signUpAttributesCard" });
            const requests = authRequestCount;
            await submitAttributes(true);
            expect(
                await page.$eval(
                    "#signUpAttributeFields input[name='city']",
                    (input) => {
                        if (!(input instanceof HTMLInputElement)) {
                            throw new Error(
                                "Expected the requested city input."
                            );
                        }
                        return input.validity.valueMissing;
                    }
                )
            ).toBe(true);
            expect(authRequestCount).toBe(requests);
            await BrowserStateUtils.verifyNotSignedIn(page);
            await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
            expect(
                (await browserCache.getAccountFromCache()) ?? []
            ).toHaveLength(0);
        },
        AUTH_TIMEOUT
    );
});
