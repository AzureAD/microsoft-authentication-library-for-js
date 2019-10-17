/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenCacheItem } from "msal-common";
import { BrowserStorage } from "./BrowserStorage";
import { CACHE_PREFIX, RESOURCE_DELIM, INTERACTION_IN_PROGRESS, PersistentCacheKeys, TemporaryCacheKeys } from "../utils/Constants";
import { CacheOptions } from "../app/Configuration";

export class CacheManager {

    storage: BrowserStorage;
    private rollbackEnabled: boolean;

    constructor(clientId: string, cacheConfig: CacheOptions) {
        // This is hardcoded to true for now. We may make this configurable in the future
        this.rollbackEnabled = true;
        this.storage = new BrowserStorage(cacheConfig.cacheLocation, clientId, this.rollbackEnabled);

        this.migrateCacheEntries(cacheConfig.storeAuthStateInCookie);
    }

    /**
     * Support roll back to old cache schema until the next major release: true by default now
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntries(storeAuthStateInCookie: boolean) {

        const idTokenKey = `${CACHE_PREFIX}.${PersistentCacheKeys.IDTOKEN}`;
        const clientInfoKey = `${CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
        const errorKey = `${CACHE_PREFIX}.${PersistentCacheKeys.ERROR}`;
        const errorDescKey = `${CACHE_PREFIX}.${PersistentCacheKeys.ERROR_DESC}`;

        const idTokenValue = this.storage.getItem(idTokenKey);
        const clientInfoValue = this.storage.getItem(clientInfoKey);
        const errorValue = this.storage.getItem(errorKey);
        const errorDescValue = this.storage.getItem(errorDescKey);

        const values = [idTokenValue, clientInfoValue, errorValue, errorDescValue];
        const keysToMigrate = [PersistentCacheKeys.IDTOKEN, PersistentCacheKeys.CLIENT_INFO, PersistentCacheKeys.ERROR, PersistentCacheKeys.ERROR_DESC];

        keysToMigrate.forEach((cacheKey, index) => this.createCacheEntry(cacheKey, values[index], storeAuthStateInCookie));
    }

    /**
     * Utility function to help with rollback keys
     * @param newKey
     * @param value
     * @param storeAuthStateInCookie
     */
    private createCacheEntry(newKey: string, value: string, storeAuthStateInCookie?: boolean) {
        if (newKey && value) {
            this.storage.setItem(newKey, value, storeAuthStateInCookie);
        }
    }

    /**
     * Get all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    getAllAccessTokens(clientId: string, homeAccountIdentifier: string): Array<AccessTokenCacheItem> {
        const results = this.storage.getKeys().reduce((tokens, key) => {
            if (this.storage.containsKey(key) && key.match(clientId) && key.match(homeAccountIdentifier)) {
                const value = this.storage.getItem(key);
                if (value) {
                    const newAccessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                    return tokens.concat([ newAccessTokenCacheItem ]);
                }
            }

            return tokens;
        }, []);

        return results;
    }

    /**
     * Remove all temporary cache entries
     * @param state
     */
    removeAcquireTokenEntries(state?: string): void {
        let key: string;
        for (key in this.storage.getKeys()) {
            if (this.storage.containsKey(key)) {
                if ((key.indexOf(TemporaryCacheKeys.AUTHORITY) !== -1 || key.indexOf(TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT) !== 1) && (!state || key.indexOf(state) !== -1)) {
                    const resourceDelimSplitKey = key.split(RESOURCE_DELIM);
                    let keyState;
                    if (resourceDelimSplitKey.length > 1) {
                        keyState = resourceDelimSplitKey[resourceDelimSplitKey.length-1];
                    }
                    if (keyState === state && !this.tokenRenewalInProgress(keyState)) {
                        this.storage.removeItem(key);
                        this.storage.removeItem(TemporaryCacheKeys.RENEW_STATUS + state);
                        this.storage.removeItem(TemporaryCacheKeys.STATE_LOGIN);
                        this.storage.removeItem(TemporaryCacheKeys.STATE_ACQ_TOKEN);
                        this.storage.removeItem(TemporaryCacheKeys.LOGIN_REQUEST);
                        this.storage.removeItem(TemporaryCacheKeys.INTERACTION_STATUS);
                        this.storage.removeItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}`);
                        this.storage.setItemCookie(key, "", -1);
                        this.clearMsalCookie(state);
                    }
                }
            }
        }
    }

    /**
     * Return if the token renewal is still in progress
     * @param stateValue
     */
    private tokenRenewalInProgress(stateValue: string): boolean {
        const renewStatus = this.storage.getItem(TemporaryCacheKeys.RENEW_STATUS + stateValue);
        return !!(renewStatus && renewStatus === INTERACTION_IN_PROGRESS);
    }

    /**
     * Clear all cookies
     */
    public clearMsalCookie(state?: string): void {
        const nonceKey = state ? `${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}` : TemporaryCacheKeys.NONCE_IDTOKEN;
        this.storage.clearItemCookie(nonceKey);
        this.storage.clearItemCookie(TemporaryCacheKeys.STATE_LOGIN);
        this.storage.clearItemCookie(TemporaryCacheKeys.LOGIN_REQUEST);
        this.storage.clearItemCookie(TemporaryCacheKeys.STATE_ACQ_TOKEN);
    }

}
