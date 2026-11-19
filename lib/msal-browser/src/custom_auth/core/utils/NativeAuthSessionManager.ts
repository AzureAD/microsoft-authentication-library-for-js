/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, Logger } from "@azure/msal-common/browser";
import { BrowserCacheManager } from "../../../cache/BrowserCacheManager.js";

export class NativeAuthSessionManager {
    constructor(
        private readonly cacheManager: BrowserCacheManager,
        private readonly logger: Logger
    ) {}

    /**
     * Marks an account session as Native Auth after its tokens are cached.
     * Existing account removal and full-cache cleanup remove this marker.
     */
    setNativeAuthSession(account: AccountInfo, correlationId: string): void {
        this.cacheManager.setItem(
            this.generateNativeAuthSessionKey(account),
            "native",
            correlationId
        );
    }

    /**
     * Returns whether the configured cache contains a Native Auth session marker for this account.
     */
    isNativeAuthSession(account: AccountInfo): boolean {
        return this.cacheManager
            .getKeys()
            .includes(this.generateNativeAuthSessionKey(account));
    }

    /**
     * Uses native routing before sign-in or when the first cached account has a Native Auth session marker.
     * Multiple cached accounts are unsupported and produce a warning.
     */
    shouldUseNativeAuth(correlationId: string): boolean {
        const accounts = this.cacheManager.getAllAccounts({}, correlationId);

        if (accounts.length > 1) {
            this.logger.warning(
                "Multiple accounts found in cache. This is not supported in the Native Auth scenario.",
                correlationId
            );
        }

        const account = accounts[0];

        return !account || this.isNativeAuthSession(account);
    }

    private generateNativeAuthSessionKey(account: AccountInfo): string {
        return this.cacheManager.generateCacheKey(
            `auth-flow.native.${account.homeAccountId}.${account.environment}`
        );
    }
}
