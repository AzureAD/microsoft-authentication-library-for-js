/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/* eslint-disable no-console -- E2E diagnostics omit credentials and account identifiers. */

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
import {
    getNativeAuthConfigValue,
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

describe("Native Auth Sample - V2 Sign Out Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    let browser: puppeteer.Browser;
    let context: puppeteer.BrowserContext;
    let page: puppeteer.Page;
    let browserCache: BrowserCacheUtils;
    let corsProcess: ChildProcess | undefined;
    let proxyPort: number;
    let username: string;
    let accountPwd: string;
    let currentAttempt = 0;
    let startedAt = 0;

    function logStep(step: string): void {
        console.log(
            `[E2E-V2-SO-01][test attempt ${currentAttempt}/${
                RETRY_TIMES + 1
            }][+${Date.now() - startedAt}ms] ${step}`
        );
    }

    beforeAll(async () => {
        username = getNativeAuthConfigValue(
            "native_auth.sign_in_email_password_username_v2"
        );
        accountPwd = nativeAuthConfig.passwordSignInEmailCode;
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
        currentAttempt++;
        startedAt = Date.now();
        context = await browser.createBrowserContext();
        page = await context.newPage();
        page.setDefaultTimeout(STANDARD_TIMEOUT);
        browserCache = new BrowserCacheUtils(page, "sessionStorage");
        const label = `[E2E-V2-SO-01][test attempt ${currentAttempt}]`;
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
        await page.goto(`${getHomeUrl()}?apiVersion=v2&usePwdConfig=true`);
        await pcaInitializedPoller(page, AUTH_TIMEOUT);
        expect(
            await page.$eval(
                "#apiVersionLabel",
                (element) => element.textContent
            )
        ).toBe("API V2");
        await BrowserStateUtils.verifyNotSignedIn(page);
        await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
        expect((await browserCache.getAccountFromCache()) ?? []).toHaveLength(
            0
        );
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
        "E2E-V2-SO-01: V2-authenticated account signs out and clears cached credentials",
        async () => {
            logStep("Sign in through V2 with the existing password account");
            await UIInteractionUtils.waitAndClick(
                page,
                "#showSignInBtn",
                "Show sign-in",
                STANDARD_TIMEOUT
            );
            await UIInteractionUtils.typeIntoElement(
                page,
                "#username",
                username,
                "Account username"
            );
            await UIInteractionUtils.waitAndClick(
                page,
                "#signInBtn",
                "Start sign-in",
                STANDARD_TIMEOUT
            );
            await page.waitForSelector("#passwordInputCard", { visible: true });
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
            await BrowserStateUtils.waitForAuthenticationComplete(
                page,
                STANDARD_TIMEOUT
            );
            await TokenVerificationUtils.verifySuccessfulAuthentication(
                browserCache
            );
            expect(await browserCache.getAccountFromCache()).toHaveLength(1);

            logStep("Sign out using the existing navigation action");
            await UIInteractionUtils.waitAndClick(
                page,
                "#navSignOutBtn",
                "Sign out",
                STANDARD_TIMEOUT
            );
            await page.waitForFunction(
                () =>
                    document
                        .getElementById("authStatusBanner")
                        ?.textContent?.includes("No user signed in"),
                { timeout: STANDARD_TIMEOUT }
            );
            await BrowserStateUtils.verifyNotSignedIn(page);
            await TokenVerificationUtils.verifyNoTokensInCache(browserCache);
            expect(
                (await browserCache.getAccountFromCache()) ?? []
            ).toHaveLength(0);
            logStep("Signed-out UI and empty account/token caches verified");
        },
        AUTH_TIMEOUT
    );
});
