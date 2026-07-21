/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Page, WaitForOptions } from "puppeteer";
import { Screenshot } from "./TestUtils";
import { BrowserCacheUtils } from "./BrowserCacheTestUtils";
import { HtmlSelectors } from "./Constants";

/**
 * Value present in the ID token `signin_state` claim when the user opted in to
 * "Keep me signed in" during interactive authentication.
 */
export const KMSI_SIGNIN_STATE = "kmsi";

/** Selectors for the "Keep me signed in" (KMSI) prompt. */
export const KmsiSelectors = {
    // "Yes" — persist the session (sets a persistent auth cookie, adds "kmsi"
    // to the id token signin_state claim).
    YES: "#idSIButton9, input[name='idSIButton9']",
    // "No" — do not persist.
    NO: "#idBtn_Back, input[name='idBtn_Back']",
};

const KMSI_NAVIGATION_CONFIG: WaitForOptions = {
    waitUntil: ["load", "domcontentloaded", "networkidle0"],
    timeout: 10000,
};

/**
 * Decoded relevant claims of an ID token. Only the claims the brokering e2e
 * tests assert on are typed; everything else is available via the index
 * signature.
 */
export interface IdTokenClaims {
    /**
     * Array describing the sign-in session state. Contains {@link KMSI_SIGNIN_STATE}
     * ("kmsi") when Keep Me Signed In was selected.
     */
    signin_state?: string[];
    [claim: string]: unknown;
}

/**
 * Decodes the payload segment of a JWT WITHOUT verifying its signature.
 * For test assertions only — never use for trust decisions.
 */
export function decodeJwtPayload(jwt: string): IdTokenClaims {
    const parts = jwt.split(".");
    if (parts.length < 2) {
        throw new Error(
            "Malformed JWT: expected at least a header and payload segment"
        );
    }
    // base64url -> base64
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(payload, "base64").toString("utf-8");
    return JSON.parse(json) as IdTokenClaims;
}

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

    const secret = JSON.parse(rawEntity).secret as string;
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
    await Promise.all([
        page.waitForNavigation(KMSI_NAVIGATION_CONFIG).catch(() => {}),
        page.click(selector),
    ]);
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
    const hasKmsi =
        Array.isArray(signinState) && signinState.includes(KMSI_SIGNIN_STATE);

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
