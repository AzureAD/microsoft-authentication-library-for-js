/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../../cache/BrowserCacheManager.js";

/**
 * Marks an account session as Native Auth after its tokens are cached.
 * Existing account removal and full-cache cleanup remove this marker.
 */
export function setNativeAuthSession(
    cacheManager: BrowserCacheManager,
    account: AccountInfo,
    correlationId: string
): void {
    cacheManager.setItem(
        generateNativeAuthSessionKey(cacheManager, account),
        "native",
        correlationId
    );
}

/**
 * Returns whether the configured cache contains a Native Auth session marker for this account.
 */
export function isNativeAuthSession(
    cacheManager: BrowserCacheManager,
    account: AccountInfo
): boolean {
    return cacheManager
        .getKeys()
        .includes(generateNativeAuthSessionKey(cacheManager, account));
}

function generateNativeAuthSessionKey(
    cacheManager: BrowserCacheManager,
    account: AccountInfo
): string {
    return cacheManager.generateCacheKey(
        `auth-flow.native.${account.homeAccountId}.${account.environment}`
    );
}
