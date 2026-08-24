/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Platform-broker (JS-WAM) test harness for the Nested App Authentication
 * sample.
 *
 * The real platform broker only engages when the browser can reach the
 * Microsoft SSO extension, and that extension only keeps its canonical id — the
 * id the native messaging host (`C:\Windows\BrowserCore`) trusts — when it is
 * force-installed by machine policy into a *branded Chrome* profile. Puppeteer's
 * bundled Chromium plus its default `--disable-extensions` /
 * `--disable-background-networking` flags prevent that, so the broker path can
 * NOT use the shared jest-puppeteer harness. This module instead drives branded
 * Chrome through Playwright's `launchPersistentContext`, stripping the default
 * flags so the force-listed extension installs into a throwaway profile.
 *
 * Requirements for the extension to load (all satisfied only on a self-hosted,
 * AAD-joined, WAM-enabled Windows agent — never the hosted CI pool):
 *   - Windows, AzureAdJoined = YES, WamDefaultSet = YES.
 *   - `C:\Windows\BrowserCore\BrowserCore.exe` + its native-host manifest.
 *   - `ExtensionInstallForcelist` (HKLM) contains the SSO extension id.
 *   - Branded Google Chrome installed (policies apply to Chrome, not Chromium).
 *
 * This is why the broker spec is opt-in (`NAA_BROKER_E2E=1`) and never part of
 * CI. See the sample README ("Running the platform-broker e2e tests").
 */

import { chromium, BrowserContext, Page, Frame } from "playwright";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Canonical Store id of the Microsoft SSO (Single Sign On) extension — the id
 * the WAM native messaging host allow-lists. Overridable for environments that
 * force-install a different build.
 */
export const SSO_EXTENSION_ID =
    process.env.SSO_EXTENSION_ID || "ppnbnpeolgkicgegkbkbjmhlideopiji";

/**
 * Chromium default args that must be stripped for a force-installed extension
 * to download and load into a fresh profile (see the spike comparison notes).
 */
const IGNORED_DEFAULT_ARGS = [
    "--disable-extensions",
    "--disable-background-networking",
    "--disable-component-extensions-with-background-pages",
    "--disable-default-apps",
    "--disable-sync",
];

/** Milliseconds to wait for the force-installed extension to land on disk. */
const EXTENSION_INSTALL_TIMEOUT_MS = 20000;

export interface BrokerContext {
    context: BrowserContext;
    userDataDir: string;
    /** True when the SSO extension force-installed into the throwaway profile. */
    extensionPresent: boolean;
}

/**
 * Launches branded Chrome with a fresh persistent profile so machine policy
 * force-installs the Microsoft SSO extension (the platform broker). Resolves
 * once the extension is present on disk (or the timeout elapses, in which case
 * `extensionPresent` is false and the caller should skip the broker assertions).
 */
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

/**
 * Closes the persistent context and removes the throwaway profile directory.
 */
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

/**
 * Polls `<userDataDir>/Default/Extensions/<id>` until the SSO extension is
 * force-installed. The MV3 service worker is dormant, so on-disk presence — not
 * `context.serviceWorkers()` — is the reliable readiness signal.
 */
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

/**
 * Reads the MSAL token store from the given page or frame's sessionStorage and
 * buckets the credential keys by type. Mirrors `BrowserCacheUtils.getTokens` but
 * against Playwright (the shared util is puppeteer-typed). Accepts a `Frame` so
 * the nested app's iframe-partitioned sessionStorage can be read directly — a
 * fresh top-level tab would not share it.
 */
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

/**
 * Reads the MSAL account-key list (`msal.3.account.keys`) from sessionStorage.
 */
export async function readAccountKeys(
    page: Page | Frame
): Promise<string[] | null> {
    const raw = await page.evaluate(
        () => window.sessionStorage["msal.3.account.keys"]
    );
    return raw ? (JSON.parse(raw) as string[]) : null;
}

/**
 * True when exactly one non-PoP access-token key covers all requested scopes.
 */
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

/*
 * Minimal AAD sign-in selectors. `e2e-test-utils` only re-exports
 * `SubmitButtonSelectors`, and its `enterCredentials` helper relies on
 * puppeteer-only locator syntax (`::-p-text`), so the broker harness carries its
 * own small, Playwright-compatible selector set.
 */
const USERNAME_INPUT =
    "#i0116, input[name='i0116'], #usernameEntry, input[type='email']";
const PASSWORD_INPUT =
    "#i0118, input[name='i0118'], #passwordEntry, input[type='password']";
const PRIMARY_SUBMIT =
    "#idSIButton9, input[name='idSIButton9'], #next, button[type='submit'], input[type='submit']";
const KMSI_TITLE = "#kmsiTitle";

/**
 * Signs an account into AAD on the given (popup) page by filling the username,
 * password, and dismissing the "Stay signed in?" (KMSI) prompt. Tolerant of the
 * optional dialogs AAD chains after password entry.
 */
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
