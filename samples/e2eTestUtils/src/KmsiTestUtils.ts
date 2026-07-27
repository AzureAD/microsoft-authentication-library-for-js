/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Page, WaitForOptions } from "puppeteer";
import { Screenshot } from "./TestUtils";
import {
    BrowserCacheUtils,
    isCachedTokenEncrypted,
} from "./BrowserCacheTestUtils";
import { HtmlSelectors, SubmitButtonSelectors } from "./Constants";
import type { IdTokenClaims } from "@azure/msal-common";

/**
 * Value present in the ID token `signin_state` claim when the user opted in to
 * "Keep me signed in" during interactive authentication.
 */
export const KMSI_SIGNIN_STATE = "kmsi";

/** Selectors for the "Keep me signed in" (KMSI) prompt. */
export const KmsiSelectors = {
    // "Yes" — persist the session (sets a persistent auth cookie, adds "kmsi"
    // to the id token signin_state claim).
    YES: SubmitButtonSelectors.IDSIBUTTON9,
    // "No" — do not persist.
    NO: SubmitButtonSelectors.IDBTNBACK,
};

const KMSI_NAVIGATION_CONFIG: WaitForOptions = {
    waitUntil: ["load", "domcontentloaded", "networkidle0"],
    timeout: 10000,
};

/**
 * ID token claims shape. Re-exported from `@azure/msal-common` — MSAL already
 * defines this (including the `signin_state` claim used for KMSI detection), so
 * the e2e utils reuse it rather than declaring a parallel interface.
 */
export type { IdTokenClaims };

/**
 * Decodes the payload segment of a JWT WITHOUT verifying its signature.
 * For test assertions only — never use for trust decisions.
 */
export function decodeJwtPayload(jwt: string): IdTokenClaims {
    const parts = jwt.split(".");
    if (parts.length < 3) {
        throw new Error(
            "Malformed JWT: expected header, payload, and signature segments"
        );
    }
    // base64url -> base64
    const payload = decodeBase64Url(parts[1]);
    const json = payload.toString("utf-8");
    return JSON.parse(json) as IdTokenClaims;
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
 * Asserts whether the ID token `signin_state` claim reflects a Keep Me Signed
 * In session.
 *
 * @param expected - true asserts "kmsi" IS present (KMSI opted in), false asserts
 *                   it is NOT present.
 */
export function assertKmsiSigninState(
    claims: IdTokenClaims,
    expected: boolean = true
): void {
    const signinState = claims.signin_state ?? [];
    const kmsiValues = [KMSI_SIGNIN_STATE, "dvc_dmjd", "dvc_mngd", "dvc_cmp"];
    const hasKmsi =
        Array.isArray(signinState) &&
        signinState.some((value) =>
            kmsiValues.includes(value.trim().toLowerCase())
        );

    expect(hasKmsi).toBe(expected);
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
