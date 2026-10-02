/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { execFileSync } from "child_process";
import * as puppeteer from "puppeteer";
import { BrowserCacheUtils } from "e2e-test-utils";

const SSO_EXTENSION_PATH = process.env.SSO_EXTENSION_PATH || "";
const SSO_EXTENSION_ID = "ppnbnpeolgkicgegkbkbjmhlideopiji";
const SSO_EXTENSION_TIMEOUT = 20000;
const BROWSERCORE_HOST_NAME = "com.microsoft.browsercore";
const CHROME_FOR_TESTING_NATIVE_HOST_KEYS = [
    `HKCU\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts\\${BROWSERCORE_HOST_NAME}`,
    `HKLM\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts\\${BROWSERCORE_HOST_NAME}`,
];

export const PLATFORM_LOGIN_TIMEOUT = 180000;

export interface PlatformBrokerProfile {
    extensionDir: string;
    userDataDir: string;
}

export interface PlatformBrokerResponse {
    homeAccountId?: string;
    nativeAccountId: string;
}

function getBrowserCoreManifestPath(): string | undefined {
    for (const registryKey of CHROME_FOR_TESTING_NATIVE_HOST_KEYS) {
        try {
            const output = execFileSync(
                "reg.exe",
                ["query", registryKey, "/ve"],
                { encoding: "utf8" }
            );
            const match = output.match(/REG_SZ\s+(.+)\s*$/m);
            if (match) {
                return match[1].trim().replace(/^"(.*)"$/, "$1");
            }
        } catch {
            // Try the next supported registry hive.
        }
    }
    return undefined;
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

    const browserCoreManifestPath = getBrowserCoreManifestPath();
    if (!browserCoreManifestPath || !fs.existsSync(browserCoreManifestPath)) {
        throw new Error(
            `${BROWSERCORE_HOST_NAME} must be registered for Chrome for Testing under ` +
                "HKCU or HKLM\\Software\\Google\\Chrome for Testing\\NativeMessagingHosts"
        );
    }

    const browserCoreManifest = JSON.parse(
        fs.readFileSync(browserCoreManifestPath, "utf8")
    ) as { allowed_origins?: string[] };
    if (
        !browserCoreManifest.allowed_origins?.includes(
            `chrome-extension://${SSO_EXTENSION_ID}/`
        )
    ) {
        throw new Error(
            `${browserCoreManifestPath} does not allow the Microsoft SSO extension`
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
        await browser.close();
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

export async function verifyPlatformBrokerResponse(
    target: puppeteer.Page
): Promise<PlatformBrokerResponse> {
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
    const authData = JSON.parse(authDataText || "") as {
        account?: {
            homeAccountId?: string;
            nativeAccountId?: string;
        };
        fromPlatformBroker?: boolean;
    };

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

export async function verifyPlatformBrokerTokenStore(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(0);
    expect(tokenStore.refreshTokens.length).toBe(0);
}
