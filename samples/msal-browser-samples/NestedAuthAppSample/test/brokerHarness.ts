/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Test harness for the platform-broker (JS-WAM) NAA spec. Drives branded Chrome
// via Playwright so the force-installed Microsoft SSO extension loads, and reads
// the MSAL cache to assert broker outcomes.

import { chromium, Browser, BrowserContext } from "playwright-core";
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
const BROWSER_CLOSE_TIMEOUT_MS = 10000;

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
    const executablePath = process.env.CHROME_FOR_TESTING_PATH;
    const extensionSource = process.env.SSO_EXTENSION_PATH;
    const extensionDir = extensionSource
        ? path.join(userDataDir, "sso-extension")
        : undefined;
    if (extensionDir && extensionSource) {
        fs.cpSync(extensionSource, extensionDir, { recursive: true });
    }

    const args = [
        "--no-first-run",
        "--no-default-browser-check",
        "--ignore-certificate-errors",
        ...(extensionDir
            ? [
                  "--disable-features=DisableLoadExtensionCommandLineSwitch",
                  `--disable-extensions-except=${extensionDir}`,
                  `--load-extension=${extensionDir}`,
              ]
            : []),
    ];
    const context = executablePath
        ? await chromium.launchPersistentContext(userDataDir, {
              executablePath,
              headless: false,
              ignoreHTTPSErrors: true,
              ignoreDefaultArgs: IGNORED_DEFAULT_ARGS,
              args,
          })
        : await chromium.launchPersistentContext(userDataDir, {
              channel: "chrome",
              headless: false,
              ignoreHTTPSErrors: true,
              ignoreDefaultArgs: IGNORED_DEFAULT_ARGS,
              args,
          });

    const extensionPresent = extensionDir
        ? await waitForActiveExtension(context)
        : await waitForExtension(userDataDir);
    return { context, userDataDir, extensionPresent };
}

async function closeWithTimeout(close: () => Promise<void>): Promise<void> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            Promise.resolve().then(close),
            new Promise<never>((_, reject) => {
                timer = setTimeout(
                    () =>
                        reject(
                            new Error(
                                `Broker browser cleanup timed out after ${BROWSER_CLOSE_TIMEOUT_MS}ms`
                            )
                        ),
                    BROWSER_CLOSE_TIMEOUT_MS
                );
            }),
        ]);
    } finally {
        clearTimeout(timer);
    }
}

// Keep cleanup failures visible even when closing the owned browser recovers.
export async function closeBrokerContext(
    broker:
        | {
              context: Pick<BrowserContext, "close"> & {
                  browser(): Pick<Browser, "close"> | null;
              };
              userDataDir: string;
          }
        | undefined
): Promise<void> {
    if (!broker) {
        return;
    }
    const errors: unknown[] = [];
    let closed = false;
    try {
        await closeWithTimeout(() => broker.context.close());
        closed = true;
    } catch (error) {
        errors.push(error);
        try {
            const browser = broker.context.browser();
            if (!browser) {
                throw new Error("Broker context has no owned browser to close");
            }
            await closeWithTimeout(() => browser.close());
            closed = true;
        } catch (browserError) {
            errors.push(browserError);
        }
    }
    if (closed) {
        try {
            fs.rmSync(broker.userDataDir, { recursive: true, force: true });
        } catch (error) {
            errors.push(error);
        }
    }
    if (errors.length) {
        throw new AggregateError(errors, "Broker browser cleanup failed");
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

async function waitForActiveExtension(
    context: BrowserContext
): Promise<boolean> {
    const extensionOrigin = `chrome-extension://${SSO_EXTENSION_ID}/`;
    const deadline = Date.now() + EXTENSION_INSTALL_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (
            context
                .serviceWorkers()
                .some((worker) => worker.url().startsWith(extensionOrigin))
        ) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return false;
}
