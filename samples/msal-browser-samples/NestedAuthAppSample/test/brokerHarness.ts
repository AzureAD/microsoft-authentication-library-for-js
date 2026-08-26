/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Test harness for the platform-broker (JS-WAM) NAA spec. Drives branded Chrome
// via Playwright so the force-installed Microsoft SSO extension loads, and reads
// the MSAL cache to assert broker outcomes.

import { chromium, BrowserContext, Page, Frame } from "playwright";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Canonical id of the Microsoft SSO extension the WAM native host allow-lists.
export const SSO_EXTENSION_ID =
    process.env.SSO_EXTENSION_ID || "ppnbnpeolgkicgegkbkbjmhlideopiji";

// Chromium default args that must be stripped for a force-installed extension
// to load into a fresh profile.
const IGNORED_DEFAULT_ARGS = [
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-extensions-with-background-pages",
    "--disable-default-apps",
    "--disable-sync",
];

const EXTENSION_INSTALL_TIMEOUT_MS = 20000;

export interface BrokerContext {
    context: BrowserContext;
    userDataDir: string;
    /** True when the SSO extension force-installed into the throwaway profile. */
    extensionPresent: boolean;
}

// Launches branded Chrome with a fresh profile so the SSO extension force-installs.
// `extensionPresent` is false if it does not appear before the timeout.
export async function launchBrokerContext(): Promise<BrokerContext> {
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "naa-broker-"));

    const context = await chromium.launchPersistentContext(userDataDir, {
        channel: "chrome",
        headless: false,
        ignoreHTTPSErrors: true,
        ignoreDefaultArgs: IGNORED_DEFAULT_ARGS,
        args: [
            "--no-first-run",
            "--no-default-browser-check",
            "--ignore-certificate-errors",
        ],
    });

    const extensionPresent = await waitForExtension(userDataDir);
    return { context, userDataDir, extensionPresent };
}

// Closes the context and removes the throwaway profile directory.
export async function closeBrokerContext(
    broker: BrokerContext | undefined
): Promise<void> {
    if (!broker) {
        return;
    }
    try {
        await broker.context.close();
    } finally {
        fs.rmSync(broker.userDataDir, { recursive: true, force: true });
    }
}

// Polls the profile's extensions dir for the SSO extension. The MV3 service
// worker is dormant, so on-disk presence is the reliable readiness signal.
async function waitForExtension(userDataDir: string): Promise<boolean> {
    const extDir = path.join(userDataDir, "Default", "Extensions");
    const deadline = Date.now() + EXTENSION_INSTALL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        let installed: string[] = [];
        try {
            installed = fs.readdirSync(extDir);
        } catch {
            installed = [];
        }
        if (installed.includes(SSO_EXTENSION_ID)) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
}

// #region Cache assertions

export interface TokenStore {
    idTokens: string[];
    accessTokens: string[];
    refreshTokens: string[];
}

// Reads the MSAL cache from the page or frame's sessionStorage and buckets keys
// by credential type. Accepts a Frame so the nested app's iframe-partitioned
// storage can be read directly.
export async function readSessionTokenStore(
    page: Page | Frame
): Promise<TokenStore> {
    const storage = await page.evaluate(() =>
        Object.assign({}, window.sessionStorage)
    );

    const store: TokenStore = {
        idTokens: [],
        accessTokens: [],
        refreshTokens: [],
    };
    for (const key of Object.keys(storage)) {
        if (key.includes("idtoken")) {
            store.idTokens.push(key);
        } else if (key.includes("accesstoken")) {
            store.accessTokens.push(key);
        } else if (key.includes("refreshtoken")) {
            store.refreshTokens.push(key);
        }
    }
    return store;
}

// Reads the MSAL account-key list from sessionStorage.
export async function readAccountKeys(
    page: Page | Frame
): Promise<string[] | null> {
    const raw = await page.evaluate(
        () => window.sessionStorage["msal.3.account.keys"]
    );
    return raw ? (JSON.parse(raw) as string[]) : null;
}

// True when exactly one non-PoP access-token key covers all requested scopes.
export function accessTokenForScopesExists(
    accessTokenKeys: string[],
    scopes: string[]
): boolean {
    const matches = accessTokenKeys
        .filter((key) => key.indexOf("accesstoken_with_authscheme") === -1)
        .filter((key) =>
            scopes.every((scope) => key.includes(scope.toLowerCase()))
        );
    return matches.length === 1;
}

// #endregion

// #region AAD credential entry (Playwright-native)

const USERNAME_INPUT =
    "#i0116, input[name='i0116'], #usernameEntry, input[type='email']";
const PASSWORD_INPUT =
    "#i0118, input[name='i0118'], #passwordEntry, input[type='password']";
const PRIMARY_SUBMIT =
    "#idSIButton9, input[name='idSIButton9'], #next, button[type='submit'], input[type='submit']";
const KMSI_TITLE = "#kmsiTitle";

// Signs an account into AAD on the given popup page: username, password, and
// the optional "Stay signed in?" (KMSI) prompt.
export async function enterAadCredentials(
    page: Page,
    username: string,
    password: string
): Promise<void> {
    await page.waitForSelector(USERNAME_INPUT, { timeout: 30000 });
    await page.fill(USERNAME_INPUT, username);
    await page.click(PRIMARY_SUBMIT);

    await page.waitForSelector(PASSWORD_INPUT, { timeout: 30000 });
    await page.fill(PASSWORD_INPUT, password);
    await page.click(PRIMARY_SUBMIT);

    // "Stay signed in?" — accept it when shown; harmless when it is not.
    try {
        await page.waitForSelector(KMSI_TITLE, { timeout: 5000 });
        await page.click(PRIMARY_SUBMIT);
    } catch {
        // KMSI prompt not shown (e.g. broker suppressed it) — continue.
    }
}

// #endregion
