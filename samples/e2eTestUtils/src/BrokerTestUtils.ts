/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Page, Frame } from "puppeteer";
import { Screenshot } from "./TestUtils";
import { BrowserCacheUtils } from "./BrowserCacheTestUtils";

export const DEFAULT_BROKER_FRAME_TIMEOUT = 15000;

/** Default DOM selectors for the BrokerTestApp-React sample. */
export const BrokerFrameSelectors = {
    BROKER_READY: "xpath=//button[contains(., 'Login')]",
    EMBEDDED_READY: "xpath=//button[contains(., 'acquireTokenSilent')]",
    EMBEDDED_AUTHENTICATED: "xpath=//th[contains(., 'homeAccountId')]",
};

/**
 * Snapshot of the tokens/account observed in a broker (parent) app cache,
 * returned by {@link verifyBrokerTokenStore} so a subsequent
 * {@link verifyBrokeredTokenStore} call can assert isolation from it.
 */
export interface BrokerCacheSnapshot {
    accessToken: string;
    idToken: string;
    account: Array<string> | null;
}

/**
 * Asserts the broker (parent) app token store after an interactive login and
 * returns a snapshot for later isolation checks.
 *
 * Consolidated from the copy-pasted `verifyBrokerTokenStore` helpers in the 1P
 * `BrokerTestApp-React` specs (simpleBroker.spec.ts, deeply.nested.spec.ts).
 *
 * @param options.expectMatsTelemetryProfileId - when true, additionally asserts
 *   the cache contains a "mats-telemetry-profile-id" entry (deeply.nested spec).
 */
export async function verifyBrokerTokenStore(
    browserCache: BrowserCacheUtils,
    scopes: string[],
    options: { expectMatsTelemetryProfileId?: boolean } = {}
): Promise<BrokerCacheSnapshot> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    expect(tokenStore.refreshTokens.length).toBe(1);

    const account = await browserCache.getAccountFromCache();
    expect(account).not.toBeNull();
    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();

    if (options.expectMatsTelemetryProfileId) {
        const storage = await browserCache.getWindowStorage();
        expect(
            Object.keys(storage).includes("mats-telemetry-profile-id")
        ).toBeTruthy();
    }

    return {
        accessToken: tokenStore.accessTokens[0],
        idToken: tokenStore.idTokens[0],
        account,
    };
}

/**
 * Asserts the brokered (child/embedded) app token store. The brokered app must
 * never hold a refresh token (it stays with the broker).
 *
 * @param broker - when provided, additionally asserts the brokered app's access
 *   token, ID token, and account are all distinct from the broker's (refresh
 *   token / cache isolation).
 */
export async function verifyBrokeredTokenStore(
    browserCache: BrowserCacheUtils,
    scopes: string[],
    broker?: BrokerCacheSnapshot
): Promise<void> {
    const tokenStore = await browserCache.getTokens();
    expect(tokenStore.idTokens.length).toBe(1);
    expect(tokenStore.accessTokens.length).toBe(1);
    // Brokered apps never receive a refresh token — it stays with the broker.
    expect(tokenStore.refreshTokens.length).toBe(0);

    const embeddedAccount = await browserCache.getAccountFromCache();
    expect(embeddedAccount).not.toBeNull();

    if (broker) {
        // Access token, ID token, and account must differ from the broker's.
        expect(tokenStore.accessTokens[0]).not.toBe(broker.accessToken);
        expect(tokenStore.idTokens[0]).not.toBe(broker.idToken);
        expect(embeddedAccount).not.toBe(broker.account);
    }

    expect(
        await browserCache.accessTokenForScopesExists(
            tokenStore.accessTokens,
            scopes
        )
    ).toBeTruthy();
}

/**
 * Asserts the given cache is completely empty (e.g. after logout / before login).
 */
export async function verifyEmptyCache(
    browserCache: BrowserCacheUtils
): Promise<void> {
    const storage = await browserCache.getWindowStorage();
    expect(Object.keys(storage).length).toBe(0);
}

/**
 * Waits for and returns the broker (parent) iframe, identified by the port it
 * is hosted on.
 */
export async function getBrokerFrame(
    page: Page,
    brokerPort: number,
    timeout: number = DEFAULT_BROKER_FRAME_TIMEOUT,
    readySelector: string = BrokerFrameSelectors.BROKER_READY
): Promise<Frame> {
    const brokerFrame = await page.waitForFrame(
        async (frame) => frame.url().includes(brokerPort.toString()),
        { timeout }
    );
    await brokerFrame.waitForSelector(readySelector, { timeout });
    return brokerFrame;
}

/**
 * Waits for and returns the embedded (brokered/child) iframe, identified by the
 * port it is hosted on.
 */
export async function getEmbeddedFrame(
    page: Page,
    embeddedPort: number,
    timeout: number = DEFAULT_BROKER_FRAME_TIMEOUT,
    readySelector: string = BrokerFrameSelectors.EMBEDDED_READY
): Promise<Frame> {
    const embeddedFrame = await page.waitForFrame(
        async (frame) => frame.url().includes(embeddedPort.toString()),
        { timeout }
    );
    await embeddedFrame.waitForSelector(readySelector, { timeout });
    return embeddedFrame;
}

/**
 * Waits for the embedded iframe to reach its post-authentication state (the
 * account table is rendered) and asserts the encrypted-cache cookie is present.
 */
export async function getAuthenticatedEmbeddedFrame(
    page: Page,
    embeddedPort: number,
    timeout: number = DEFAULT_BROKER_FRAME_TIMEOUT,
    readySelector: string = BrokerFrameSelectors.EMBEDDED_AUTHENTICATED
): Promise<Frame> {
    const embeddedFrame = await page.waitForFrame(
        async (frame) => frame.url().includes(embeddedPort.toString()),
        { timeout }
    );
    await embeddedFrame.waitForSelector(readySelector);

    const cookies = await page.browserContext().cookies();
    const matchingCookies = cookies.filter((cookie) => {
        return (
            cookie.name === "msal.cache.encryption" &&
            cookie.domain === "localhost" &&
            cookie.sameSite === "None" &&
            cookie.secure === true &&
            cookie.session === true
        );
    });
    expect(matchingCookies).toHaveLength(1);

    return embeddedFrame;
}

/**
 * Clicks the "acquireTokenSilent" button inside a brokered widget frame to
 * initiate a brokered login.
 */
export async function loginWidget(
    page: Page,
    screenshot: Screenshot,
    widget: Frame
): Promise<void> {
    const widgetButton = await widget.waitForSelector(
        "xpath=//button[contains(., 'acquireTokenSilent')]"
    );
    await widgetButton?.click();
    await screenshot.takeScreenshot(page, "Brokered app login clicked");
}
