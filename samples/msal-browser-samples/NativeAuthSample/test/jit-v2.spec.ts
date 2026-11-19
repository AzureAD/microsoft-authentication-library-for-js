/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable no-console -- E2E diagnostics omit credentials, contacts and OTP values. */

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
    getTenantInfo,
    nativeAuthConfig,
    testConfig,
} from "./utils/configUtils";
import {
    BrowserStateUtils,
    TokenVerificationUtils,
    UIInteractionUtils,
} from "./utils/testUtils";

const STANDARD_TIMEOUT = testConfig.timeouts.standard;
const AUTH_TIMEOUT = testConfig.timeouts.auth;

describe("Native Auth Sample - V2 JIT Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let browserCache: BrowserCacheUtils;
    let corsProcess: ChildProcess | undefined;
    let proxyPort: number;
    let accountPwd: string;
    let emailProviderPwd: string;
    let jitEmail: string;
    let currentTestId = "";
    let startedAt = 0;
    let currentAttempt = 0;
    const attempts = new Map<string, number>();

    function logStep(step: string): void {
        console.log(
            `[${currentTestId}][test attempt ${currentAttempt}/${
                RETRY_TIMES + 1
            }][+${Date.now() - startedAt}ms] ${step}`
        );
    }

    async function waitForStep(selectors: string[]): Promise<string> {
        const handle = await page.waitForFunction(
            (targets) => {
                const error = document.getElementById("errorBanner");
                if (error && getComputedStyle(error).display !== "none") {
                    return "error";
                }
                return targets.find((selector) => {
                    const element = document.querySelector(selector);
                    return (
                        element instanceof HTMLElement &&
                        element.offsetParent !== null
                    );
                });
            },
            { timeout: STANDARD_TIMEOUT },
            selectors
        );
        const outcome: unknown = await handle.jsonValue();
        await handle.dispose();
        if (outcome === "error") {
            const message = await page.$eval(
                "#errorMessage",
                (element) => element.textContent
            );
            throw new Error(`[${currentTestId}] ${message}`);
        }
        if (typeof outcome !== "string") {
            throw new Error("JIT did not reach an expected step.");
        }
        return outcome;
    }

    async function expectPendingAuthentication(): Promise<void> {
        await BrowserStateUtils.verifyNotSignedIn(page);
        await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
        expect((await browserCache.getAccountFromCache()) ?? []).toHaveLength(
            0
        );
    }

    async function openApp(): Promise<void> {
        await page.goto(
            `${getHomeUrl()}?apiVersion=v2&usePwdConfig=true&useMFA=true`
        );
        await pcaInitializedPoller(page, AUTH_TIMEOUT);
        expect(
            await page.$eval(
                "#apiVersionLabel",
                (element) => element.textContent
            )
        ).toBe("API V2");
        await expectPendingAuthentication();
    }

    async function createUnregisteredAccount(): Promise<string> {
        logStep("Create a fresh signup mailbox for this attempt");
        const { client, address } =
            await MailTmClient.createAuthenticatedAccount(emailProviderPwd);
        await UIInteractionUtils.waitAndClick(
            page,
            "#showSignUpBtn",
            "Show signup",
            STANDARD_TIMEOUT
        );
        await UIInteractionUtils.typeIntoElement(
            page,
            "#signUpUsername",
            address,
            "Signup username"
        );
        client.markCheckpoint();
        await UIInteractionUtils.waitAndClick(
            page,
            "#signUpBtn",
            "Start signup",
            STANDARD_TIMEOUT
        );
        await waitForStep(["#codeVerificationCard"]);
        logStep("Read initial signup OTP using the shared polling defaults");
        await UIInteractionUtils.typeIntoElement(
            page,
            "#verificationCode",
            await client.readOtpCode(),
            "Signup OTP",
            true
        );
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitCodeBtn",
            "Verify signup email",
            STANDARD_TIMEOUT
        );
        await waitForStep(["#signUpPasswordCard"]);
        await expectPendingAuthentication();
        await UIInteractionUtils.typeIntoElement(
            page,
            "#signUpPassword",
            accountPwd,
            "New account password"
        );
        logStep("Submit password and wait for JIT registration");
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitSignUpPasswordBtn",
            "Create password",
            STANDARD_TIMEOUT
        );
        let next = await waitForStep([
            "#signUpAttributesCard",
            "#jitMethodSelectionCard",
        ]);
        if (next === "#signUpAttributesCard") {
            const requiredIds = await page.$$eval(
                "#signUpAttributeFields input:required",
                (inputs) =>
                    inputs.map((input) => {
                        if (!(input instanceof HTMLInputElement)) {
                            throw new Error("Expected an attribute input.");
                        }
                        return { id: input.id, name: input.name };
                    })
            );
            for (const { id, name } of requiredIds) {
                const values: Record<string, string> = {
                    givenName: "TestFirstName",
                    surname: "TestLastName",
                    city: "Redmond",
                    country: "United States",
                };
                const value = values[name];
                if (!value) {
                    throw new Error(
                        `No JIT fixture value for required attribute ${name}.`
                    );
                }
                await UIInteractionUtils.typeIntoElement(
                    page,
                    `#${id}`,
                    value,
                    "Required signup attribute"
                );
            }
            await UIInteractionUtils.waitAndClick(
                page,
                "#submitSignUpAttributesBtn",
                "Submit required attributes",
                STANDARD_TIMEOUT
            );
            next = await waitForStep(["#jitMethodSelectionCard"]);
        }
        expect(next).toBe("#jitMethodSelectionCard");
        await expectPendingAuthentication();
        return address;
    }

    async function registerEmail(
        client: MailTmClient,
        contact: string
    ): Promise<void> {
        await waitForStep(["#jitMethodSelectionCard"]);
        await expectPendingAuthentication();
        const methodValue = await page.$eval(
            "#jitAuthMethodSelect",
            (element) => {
                if (!(element instanceof HTMLSelectElement)) {
                    throw new Error("Expected JIT method selection.");
                }
                const email = Array.from(element.options).find(
                    (option) => option.text.toLowerCase() === "email"
                );
                if (!email)
                    throw new Error(
                        "No email registration method was offered."
                    );
                return email.value;
            }
        );
        await page.select("#jitAuthMethodSelect", methodValue);
        await UIInteractionUtils.typeIntoElement(
            page,
            "#jitVerificationContact",
            contact,
            "JIT verification contact"
        );
        client.markCheckpoint();
        logStep("Request JIT registration challenge");
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitJitMethodBtn",
            "Register email method",
            STANDARD_TIMEOUT
        );
        await waitForStep(["#jitChallengeCard"]);
        await expectPendingAuthentication();
        logStep("Read registration OTP using the shared polling defaults");
        await UIInteractionUtils.typeIntoElement(
            page,
            "#jitChallengeCode",
            await client.readOtpCode(),
            "JIT verification code",
            true
        );
        await UIInteractionUtils.waitAndClick(
            page,
            "#submitJitChallengeBtn",
            "Verify JIT email",
            STANDARD_TIMEOUT
        );
        await BrowserStateUtils.waitForAuthenticationComplete(
            page,
            STANDARD_TIMEOUT
        );
        await TokenVerificationUtils.verifySuccessfulAuthentication(
            browserCache
        );
        expect(await browserCache.getAccountFromCache()).toHaveLength(1);
        logStep("JIT completed; account, tokens and scopes verified");
    }

    beforeAll(async () => {
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
        emailProviderPwd = nativeAuthConfig.passwordProvider;
        jitEmail = nativeAuthConfig.signInEmailPasswordUsernameMfa;
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
        const response = await fetch(`http://localhost:${proxyPort}/`, {
            signal: AbortSignal.timeout(STANDARD_TIMEOUT),
        });
        expect(response.status).toBe(404);
        await response.arrayBuffer();
        browser = await getBrowser();
    });

    afterAll(() => {
        if (corsProcess) stopCorsProxy(corsProcess);
    });

    beforeEach(async () => {
        currentTestId =
            expect.getState().currentTestName?.match(/E2E-V2-JI-\d+/)?.[0] ??
            "V2-JI";
        currentAttempt = (attempts.get(currentTestId) ?? 0) + 1;
        attempts.set(currentTestId, currentAttempt);
        startedAt = Date.now();
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(STANDARD_TIMEOUT);
        browserCache = new BrowserCacheUtils(page, "sessionStorage");
        const label = `[${currentTestId}][test attempt ${currentAttempt}]`;
        page.on("response", (response) => {
            const url = new URL(response.url());
            if (
                url.origin === `http://localhost:${proxyPort}` &&
                url.pathname.startsWith("/api/") &&
                response.status() >= 400
            ) {
                console.warn(`${label}[auth HTTP] HTTP ${response.status()}`);
            }
        });
        await page.setRequestInterception(true);
        page.on("request", async (request) => {
            const url = new URL(request.url());
            if (url.pathname === "/authConfig.js" && !url.search) {
                // Change only the proxy port; exercise the real SDK and service.
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
        await openApp();
    });

    afterEach(async () => {
        try {
            if (page && !page.isClosed()) {
                await BrowserStateUtils.cleanupBrowserState(page);
            }
        } finally {
            await context?.close();
        }
    });

    it(
        "E2E-V2-JI-01: Sign-up registers a different verification email",
        async () => {
            const signUpEmail = await createUnregisteredAccount();
            const { client, address } =
                await MailTmClient.createAuthenticatedAccount(emailProviderPwd);
            expect(address).not.toBe(signUpEmail);
            await registerEmail(client, address);
        },
        AUTH_TIMEOUT
    );

    it(
        "E2E-V2-JI-02: Sign-in completes registration for an unregistered account",
        async () => {
            const address = await createUnregisteredAccount();
            logStep(
                "Abandon pending registration locally and reload for sign-in"
            );
            await BrowserStateUtils.cleanupBrowserState(page);
            await openApp();
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignInBtn",
                "Show sign-in",
                STANDARD_TIMEOUT
            );
            await UIInteractionUtils.typeIntoElement(
                page,
                "#username",
                address,
                "New account username"
            );
            await UIInteractionUtils.waitAndClick(
                page,
                "#signInBtn",
                "Start sign-in",
                STANDARD_TIMEOUT
            );
            await waitForStep(["#passwordInputCard"]);
            await UIInteractionUtils.typeIntoElement(
                page,
                "#signInPassword",
                accountPwd,
                "Account password"
            );
            await UIInteractionUtils.waitAndClick(
                page,
                "#submitPasswordBtn",
                "Submit password",
                STANDARD_TIMEOUT
            );
            await waitForStep(["#jitMethodSelectionCard"]);
            const client = await MailTmClient.connectToExistingAccount(
                jitEmail,
                emailProviderPwd
            );
            await registerEmail(client, jitEmail);
        },
        AUTH_TIMEOUT
    );
});
