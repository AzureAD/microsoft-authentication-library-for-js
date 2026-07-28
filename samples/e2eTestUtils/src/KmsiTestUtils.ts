/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { Page, WaitForOptions } from "puppeteer";
import { Screenshot } from "./TestUtils";
import {
    BrowserCacheUtils,
    isCachedTokenEncrypted,
} from "./BrowserCacheTestUtils";
import { HtmlSelectors, SubmitButtonSelectors } from "./Constants";
import { AuthToken, type IdTokenClaims } from "@azure/msal-common";

/**
 * Device-state values that may appear in the ID token `signin_state` claim.
 * These are asserted independently of the SDK's KMSI check (`AuthToken.isKmsi`),
 * which only treats "kmsi"/"dvc_dmjd" as a persistent ("Keep me signed in") state.
 */
export const DeviceSigninState = {
    MANAGED: "dvc_mngd",
    COMPLIANT: "dvc_cmp",
} as const;

/** Selectors for the "Keep me signed in" (KMSI) prompt. */
export const KmsiSelectors = {
    // "Yes" — persist the session (sets a persistent auth cookie, adds "kmsi"
    // to the id token signin_state claim).
    YES: SubmitButtonSelectors.IDSIBUTTON9,
    // "No" — do not persist. This is the ESTS "Stay signed in?" back button.
    // It is intentionally NOT part of SubmitButtonSelectors: clickSubmitButton()
    // clicks the first element matching ANY SubmitButtonSelectors value, and the
    // back arrow (#idBtn_Back) is present on the password/KMSI pages BEFORE the
    // "Sign in" button in the DOM — including it there makes generic submits click
    // "Back" and bounce the login flow to the username page.
    NO: "#idBtn_Back, input[name='idBtn_Back']",
};

const KMSI_NAVIGATION_CONFIG: WaitForOptions = {
    waitUntil: ["load", "domcontentloaded", "networkidle0"],
    timeout: 10000,
};

/**
 * Decodes the payload segment of a JWT WITHOUT verifying its signature.
 * For test assertions only — never use for trust decisions.
 *
 * Delegates to the SDK's `AuthToken.extractTokenClaims` (JWS split + base64url
 * decode + JSON.parse) so the test decodes tokens exactly the way MSAL does.
 * `extractTokenClaims` requires a base64 decoder to be injected; we supply a
 * Node-friendly base64url decoder.
 */
export function decodeJwtPayload(jwt: string): IdTokenClaims {
    return AuthToken.extractTokenClaims(
        jwt,
        (input) => decodeBase64Url(input).toString("utf-8"),
        "e2e-test"
    );
}

/**
 * Converts a base64url string into a decoded Buffer.
 */
export function decodeBase64Url(base64UrlInput: string): Buffer {
    let normalized = base64UrlInput.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4) {
        normalized += "=";
    }
    return Buffer.from(normalized, "base64");
}

/** Minimal shape of a plaintext (non-encrypted) MSAL cache token entity. */
type PlaintextTokenEntity = { secret?: string };

/**
 * Reads the first cached ID token and returns its decoded claims.
 * Throws if no ID token is present in the browser cache.
 */
export async function getIdTokenClaimsFromCache(
    browserCache: BrowserCacheUtils
): Promise<IdTokenClaims> {
    const tokens = await browserCache.getTokens();
    if (tokens.idTokens.length === 0) {
        throw new Error("No ID token found in the browser cache");
    }

    const storage = await browserCache.getWindowStorage();
    const rawEntity = storage[tokens.idTokens[0]];
    if (!rawEntity) {
        throw new Error(
            `ID token entity not found for key ${tokens.idTokens[0]}`
        );
    }

    const parsed = JSON.parse(rawEntity) as object;
    if (isCachedTokenEncrypted(parsed)) {
        throw new Error(
            `Cached ID token entry for key "${tokens.idTokens[0]}" is encrypted ` +
                `and cannot be decoded without the encryption key. ` +
                `This typically happens when localStorage encryption is active and ` +
                `the encryption session cookie has expired or is unavailable in the ` +
                `current browser context.`
        );
    }

    const secret = (parsed as PlaintextTokenEntity).secret;
    if (!secret) {
        throw new Error("Cached ID token entity has no secret (raw JWT)");
    }

    return decodeJwtPayload(secret);
}

/**
 * Selects an option on the "Keep me signed in" prompt.
 *
 * @param keepSignedIn - true clicks "Yes" (persist the session), false clicks "No".
 * @throws if the KMSI prompt is not shown within the timeout.
 */
export async function selectKmsiOption(
    page: Page,
    screenshot: Screenshot,
    keepSignedIn: boolean
): Promise<void> {
    await page.waitForSelector(HtmlSelectors.KMSI_PAGE, { timeout: 5000 });
    await screenshot.takeScreenshot(page, "keepMeSignedInPage");

    const selector = keepSignedIn ? KmsiSelectors.YES : KmsiSelectors.NO;
    try {
        await Promise.all([
            page.waitForNavigation(KMSI_NAVIGATION_CONFIG).catch(() => {}),
            page.click(selector),
        ]);
    } catch (e) {
        const msg = String(e).toLowerCase();
        if (
            msg.includes("detach") ||
            msg.includes("destroyed") ||
            msg.includes("execution context")
        ) {
            // Navigation during click means the selection likely succeeded.
        } else {
            await screenshot
                .takeScreenshot(page, "errorSelectingKmsi")
                .catch(() => {});
            throw e;
        }
    }
    await screenshot.takeScreenshot(
        page,
        keepSignedIn ? "kmsiAccepted" : "kmsiDeclined"
    );
}

/**
 * Asserts whether the ID token reflects a "Keep me signed in" session.
 *
 * Delegates to the SDK's `AuthToken.isKmsi` so the test stays in lockstep with
 * product behavior — `isKmsi` treats `signin_state` values "kmsi" and "dvc_dmjd"
 * as persistent. Device-state signals (managed/compliant) are NOT part of the
 * KMSI check; assert those separately with `assertSigninStateContains`.
 *
 * @param expected - true asserts KMSI IS in effect, false asserts it is NOT.
 */
export function assertKmsiSigninState(
    claims: IdTokenClaims,
    expected: boolean = true
): void {
    expect(AuthToken.isKmsi(claims)).toBe(expected);
}

/**
 * Asserts that the ID token `signin_state` claim contains every one of the given
 * values (case-insensitive). Use for device-state signals such as
 * `DeviceSigninState.MANAGED` / `DeviceSigninState.COMPLIANT` that are independent
 * of the KMSI opt-in and only present on managed/compliant devices — so call this
 * only in scenarios where those claims are expected.
 */
export function assertSigninStateContains(
    claims: IdTokenClaims,
    expectedValues: string[]
): void {
    const signinState = (claims.signin_state ?? []).map((value) =>
        value.trim().toLowerCase()
    );
    for (const value of expectedValues) {
        expect(signinState).toContain(value.toLowerCase());
    }
}

/**
 * Reads the cached ID token and asserts its Keep Me Signed In state via the
 * `signin_state` claim. Returns the decoded claims for further assertions.
 *
 * This is the "real" KMSI assertion the brokering e2e suites should use — the
 * legacy flow only *clicked* the KMSI page and never verified persistence.
 */
export async function verifyKmsiFromCache(
    browserCache: BrowserCacheUtils,
    expected: boolean = true
): Promise<IdTokenClaims> {
    const claims = await getIdTokenClaimsFromCache(browserCache);
    assertKmsiSigninState(claims, expected);
    return claims;
}
