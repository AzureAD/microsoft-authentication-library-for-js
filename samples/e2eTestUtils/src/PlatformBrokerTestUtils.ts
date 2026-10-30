/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import * as puppeteer from "puppeteer";
import {
    AuthenticationResult,
    EventType,
    InteractionType,
    IPublicClientApplication,
} from "@azure/msal-browser";
import { BrowserCacheUtils } from "./BrowserCacheTestUtils";

const SSO_EXTENSION_PATH = process.env["SSO_EXTENSION_PATH"] || "";
const SSO_EXTENSION_ID = "ppnbnpeolgkicgegkbkbjmhlideopiji";
const SSO_EXTENSION_TIMEOUT = 20000;
const BROWSERCORE_POLICY_KEY =
    "HKLM\\SOFTWARE\\Policies\\Microsoft\\BrowserCore";
const ENABLE_PLATFORM_AUTH_VALUE = "EnablePlatformAuth";

export const PLATFORM_LOGIN_TIMEOUT = 180000;

export interface PlatformBrokerProfile {
    extensionDir: string;
    userDataDir: string;
}

export interface PlatformBrokerResponse {
    homeAccountId?: string;
    nativeAccountId: string;
}

export interface PlatformBrokerOperationResult {
    fromPlatformBroker: boolean | undefined;
    fromCache: boolean;
    homeAccountId: string;
    nativeAccountId: string | undefined;
}

type AuthModule = { msalInstance: IPublicClientApplication };

interface PlatformBrokerAuthData {
    account?: {
        homeAccountId?: string;
        nativeAccountId?: string;
    };
    fromPlatformBroker?: boolean;
}

function isPlatformAuthEnabled(): boolean {
    try {
        const output = execFileSync(
            "reg.exe",
            ["query", BROWSERCORE_POLICY_KEY, "/v", ENABLE_PLATFORM_AUTH_VALUE],
            { encoding: "utf8" }
        );
        return new RegExp(
            `${ENABLE_PLATFORM_AUTH_VALUE}\\s+REG_DWORD\\s+0x1\\s*$`,
            "m"
        ).test(output);
    } catch {
        return false;
    }
}

function verifyPlatformBrokerPrerequisites(): void {
    if (process.platform !== "win32") {
        throw new Error(
            "Platform-broker e2e tests require a WAM-enabled Windows machine"
        );
    }
    if (!SSO_EXTENSION_PATH) {
        throw new Error(
            "SSO_EXTENSION_PATH must point to the unpacked Microsoft SSO extension"
        );
    }
    if (!fs.existsSync(path.join(SSO_EXTENSION_PATH, "manifest.json"))) {
        throw new Error(
            `SSO_EXTENSION_PATH does not contain manifest.json: ${SSO_EXTENSION_PATH}`
        );
    }

    if (!isPlatformAuthEnabled()) {
        throw new Error(
            "BrowserCore platform authentication is disabled. In Registry Editor, " +
                `create ${BROWSERCORE_POLICY_KEY} and add a REG_DWORD named ` +
                `${ENABLE_PLATFORM_AUTH_VALUE} with value 1.`
        );
    }
}

export function createPlatformBrokerProfile(): PlatformBrokerProfile {
    verifyPlatformBrokerPrerequisites();

    const extensionDir = fs.mkdtempSync(path.join(os.tmpdir(), "sso-ext-"));
    const userDataDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "platform-broker-profile-")
    );
    fs.cpSync(SSO_EXTENSION_PATH, extensionDir, { recursive: true });

    return { extensionDir, userDataDir };
}

export async function launchPlatformBrokerBrowser(
    profile: PlatformBrokerProfile
): Promise<puppeteer.Browser> {
    const browser = await puppeteer.launch({
        headless: false,
        acceptInsecureCerts: true,
        timeout: 60000,
        userDataDir: profile.userDataDir,
        args: [
            "--disable-features=DisableLoadExtensionCommandLineSwitch",
            `--disable-extensions-except=${profile.extensionDir}`,
            `--load-extension=${profile.extensionDir}`,
        ],
    });

    try {
        await browser.waitForTarget(
            (target) =>
                target
                    .url()
                    .startsWith(`chrome-extension://${SSO_EXTENSION_ID}/`),
            { timeout: SSO_EXTENSION_TIMEOUT }
        );
    } catch {
        await browser.close().catch(() => {});
        throw new Error(
            `Microsoft SSO extension ${SSO_EXTENSION_ID} did not start from SSO_EXTENSION_PATH`
        );
    }

    return browser;
}

export function removePlatformBrokerProfile(
    profile: PlatformBrokerProfile | undefined
): void {
    if (!profile) {
        return;
    }
    fs.rmSync(profile.extensionDir, { recursive: true, force: true });
    fs.rmSync(profile.userDataDir, { recursive: true, force: true });
}

export async function verifyPlatformBrokerTokenStore(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(0);
    expect(tokenStore.refreshTokens.length).toBe(0);
}

async function getPlatformBrokerAuthData(
    target: puppeteer.Page
): Promise<PlatformBrokerAuthData> {
    if (!target.url().endsWith("profile")) {
        await target.locator("a#viewProfileButton").click();
    }

    const authDataText = await target
        .locator("pre#auth-json")
        .filter(
            (value) => !!value.textContent && value.textContent !== "Loading..."
        )
        .map((value) => value.textContent)
        .wait();
    return JSON.parse(authDataText || "") as PlatformBrokerAuthData;
}

function requirePlatformBrokerAccount(
    authData: PlatformBrokerAuthData
): PlatformBrokerResponse {
    expect(authData.fromPlatformBroker).toBe(true);
    expect(authData.account?.nativeAccountId).toBeTruthy();
    if (!authData.account?.nativeAccountId) {
        throw new Error(
            "Platform-broker response did not contain account.nativeAccountId"
        );
    }

    return {
        homeAccountId: authData.account.homeAccountId,
        nativeAccountId: authData.account.nativeAccountId,
    };
}

export async function verifyPlatformBrokerResponse(
    target: puppeteer.Page
): Promise<PlatformBrokerResponse> {
    return requirePlatformBrokerAccount(
        await getPlatformBrokerAuthData(target)
    );
}

/**
 * Verifies that the current account is broker-linked without asserting that
 * the Profile page's later acquireTokenSilent response came from the broker.
 */
export async function verifyPlatformBrokerAccount(
    target: puppeteer.Page
): Promise<PlatformBrokerResponse> {
    const authData = await getPlatformBrokerAuthData(target);
    expect(authData.account?.nativeAccountId).toBeTruthy();
    if (!authData.account?.nativeAccountId) {
        throw new Error(
            "Platform-broker account did not contain account.nativeAccountId"
        );
    }

    return {
        homeAccountId: authData.account.homeAccountId,
        nativeAccountId: authData.account.nativeAccountId,
    };
}

function verifyBrokerResult(
    result: PlatformBrokerOperationResult | null,
    interactionType: InteractionType
): PlatformBrokerOperationResult {
    expect(result).not.toBeNull();
    if (!result) {
        throw new Error("The requested MSAL operation did not return a result");
    }
    expect(result.nativeAccountId).toBeTruthy();
    expect(result.homeAccountId).toBeTruthy();
    if (interactionType === InteractionType.Silent) {
        expect(result.fromPlatformBroker || result.fromCache).toBe(true);
    } else {
        expect(result.fromPlatformBroker).toBe(true);
    }
    return result;
}

export async function verifyPlatformBrokerRedirect(
    page: puppeteer.Page
): Promise<PlatformBrokerOperationResult> {
    // Keep native import() in the browser rather than transpiling it to require().
    const auth = await page.evaluateHandle<[], () => Promise<AuthModule>>(
        "import('/js/auth.js')"
    );
    try {
        const result = await auth.evaluate((module: AuthModule) =>
            module.msalInstance.handleRedirectPromise().then((response) =>
                response
                    ? {
                          fromPlatformBroker: response.fromPlatformBroker,
                          fromCache: response.fromCache,
                          homeAccountId: response.account.homeAccountId,
                          nativeAccountId: response.account.nativeAccountId,
                      }
                    : null
            )
        );
        return verifyBrokerResult(result, InteractionType.Redirect);
    } finally {
        await auth.dispose();
    }
}

export async function verifyPlatformBrokerOperation(
    page: puppeteer.Page,
    interactionType: InteractionType,
    action: () => Promise<void>
): Promise<PlatformBrokerOperationResult> {
    const auth = await page.evaluateHandle<[], () => Promise<AuthModule>>(
        "import('/js/auth.js')"
    );
    let observation:
        | puppeteer.JSHandle<{
              result: PlatformBrokerOperationResult | null;
              callbackId: string | null;
          }>
        | undefined;
    try {
        observation = await auth.evaluateHandle(
            (module: AuthModule, eventType, interaction) => {
                const state: {
                    result: PlatformBrokerOperationResult | null;
                    callbackId: string | null;
                } = { result: null, callbackId: null };
                state.callbackId = module.msalInstance.addEventCallback(
                    (message) => {
                        if (
                            message.eventType === eventType &&
                            message.interactionType === interaction &&
                            message.payload &&
                            "accessToken" in message.payload &&
                            !state.result
                        ) {
                            const response: AuthenticationResult =
                                message.payload;
                            state.result = {
                                fromPlatformBroker: response.fromPlatformBroker,
                                fromCache: response.fromCache,
                                homeAccountId: response.account.homeAccountId,
                                nativeAccountId:
                                    response.account.nativeAccountId,
                            };
                        }
                    }
                );
                if (!state.callbackId) {
                    throw new Error(
                        "MSAL result observation could not be installed"
                    );
                }
                return state;
            },
            EventType.ACQUIRE_TOKEN_SUCCESS,
            interactionType
        );
        await action();
        return verifyBrokerResult(
            await observation.evaluate((state) => state.result),
            interactionType
        );
    } finally {
        try {
            if (observation) {
                await auth.evaluate((module: AuthModule, state) => {
                    if (state.callbackId) {
                        module.msalInstance.removeEventCallback(
                            state.callbackId
                        );
                    }
                }, observation);
            }
        } finally {
            await observation?.dispose();
            await auth.dispose();
        }
    }
}

export async function observePopupEarRequests(
    page: puppeteer.Page,
    action: () => Promise<void>
): Promise<number> {
    const opener = await page.createCDPSession();
    const { targetInfo: openerInfo } = await opener.send(
        "Target.getTargetInfo"
    );
    await opener.detach();
    const root = await page.browser().target().createCDPSession();
    const sessions = new Set<puppeteer.CDPSession>();
    const pending: Promise<void>[] = [];
    let requestCount = 0;
    let failObservation!: (error: unknown) => void;
    const failure = new Promise<never>((_resolve, reject) => {
        failObservation = reject;
    });
    const onAttached = ({
        sessionId,
        targetInfo,
    }: puppeteer.Protocol.Target.AttachedToTargetEvent) => {
        const observe = async () => {
            const session = root.connection()?.session(sessionId);
            if (!session) {
                throw new Error(
                    "Auto-attached popup CDP session was not found"
                );
            }
            sessions.add(session);
            try {
                if (targetInfo.openerId === openerInfo.targetId) {
                    session.on("Network.requestWillBeSent", ({ request }) => {
                        if (
                            request.method === "POST" &&
                            new URL(request.url).pathname.endsWith("/authorize")
                        ) {
                            requestCount++;
                        }
                    });
                    await session.send("Network.enable", {
                        maxPostDataSize: 0,
                    });
                }
            } finally {
                await session.send("Runtime.runIfWaitingForDebugger");
            }
        };
        // Forward async listener failures to the test, not an unhandled rejection.
        pending.push(observe().catch(failObservation));
    };
    root.on("Target.attachedToTarget", onAttached);
    try {
        await Promise.race([
            root.send("Target.setAutoAttach", {
                autoAttach: true,
                waitForDebuggerOnStart: true,
                flatten: true,
                filter: [{ type: "page" }, { exclude: true }],
            }),
            failure,
        ]);
        await Promise.race([action(), failure]);
        await Promise.race([Promise.all(pending), failure]);
        return requestCount;
    } finally {
        try {
            await root.send("Target.setAutoAttach", {
                autoAttach: false,
                waitForDebuggerOnStart: false,
                flatten: true,
            });
            await Promise.race([Promise.all(pending), failure]);
        } finally {
            root.off("Target.attachedToTarget", onAttached);
            try {
                await Promise.all(
                    Array.from(sessions, async (session) => {
                        session.removeAllListeners("Network.requestWillBeSent");
                        if (!session.detached) {
                            await session.detach();
                        }
                    })
                );
            } finally {
                await root.detach();
            }
        }
    }
}
