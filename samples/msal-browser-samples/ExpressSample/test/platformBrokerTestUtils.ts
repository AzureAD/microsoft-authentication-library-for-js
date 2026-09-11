/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as puppeteer from "puppeteer";
import { BrowserCacheUtils } from "e2e-test-utils";

const PLATFORM_BROKER_RESPONSE_KEY = "__platformBrokerResponse";
const SSO_EXTENSION_PATH = process.env.SSO_EXTENSION_PATH || "";
const SSO_EXTENSION_ID = "ppnbnpeolgkicgegkbkbjmhlideopiji";
const SSO_EXTENSION_TIMEOUT = 20000;

export const PLATFORM_LOGIN_TIMEOUT = 180000;

export interface PlatformBrokerProfile {
    extensionDir: string;
    userDataDir: string;
}

export function createPlatformBrokerProfile(): PlatformBrokerProfile {
    if (!SSO_EXTENSION_PATH) {
        throw new Error(
            "SSO_EXTENSION_PATH must point to the unpacked Microsoft SSO extension"
        );
    }

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

    await browser.waitForTarget(
        (target) =>
            target.url().startsWith(`chrome-extension://${SSO_EXTENSION_ID}/`),
        { timeout: SSO_EXTENSION_TIMEOUT }
    );

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

export async function verifyPlatformBrokerResponse(
    target: puppeteer.Page
): Promise<void> {
    const fromPlatformBroker = await target.evaluate(
        (key) => window.sessionStorage.getItem(key),
        PLATFORM_BROKER_RESPONSE_KEY
    );
    expect(fromPlatformBroker).toBe("true");
}

export async function verifyPlatformBrokerTokenStore(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(0);
    expect(tokenStore.refreshTokens.length).toBe(0);
    expect(await browserCache.getAccountFromCache()).not.toBeNull();
}
