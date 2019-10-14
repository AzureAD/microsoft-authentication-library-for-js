/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, PersistentCacheKeys, TemporaryCacheKeys, ErrorCacheKeys, INTERACTION_STATUS, RequestStatus } from "../utils/Constants";
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { CacheLocation } from "../Configuration";
import { BrowserStorage } from "./BrowserStorage";

/**
 * @hidden
 */
export class AuthCache extends BrowserStorage {// Singleton

    private clientId: string;
    private rollbackEnabled: boolean;

    constructor(clientId: string, cacheLocation: CacheLocation, storeAuthStateInCookie: boolean) {
        super(cacheLocation);
        this.clientId = clientId;
        // This is hardcoded to true for now. We may make this configurable in the future
        this.rollbackEnabled = true;
        this.migrateCacheEntries(storeAuthStateInCookie);
    }

    /**
     * Support roll back to old cache schema until the next major release: true by default now
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntries(storeAuthStateInCookie: boolean) {
        const persistentCacheSet = Object.keys(PersistentCacheKeys).map(key => super.getItem(`msal.${PersistentCacheKeys[key]}`));
        const errorCacheSet = Object.keys(ErrorCacheKeys).map(key => super.getItem(`msal.${ErrorCacheKeys[key]}`));

        const cacheSet = persistentCacheSet.concat(errorCacheSet);
        const keysToMigrate = Object.keys(cacheSet);
        keysToMigrate.forEach((cacheKey, index) => this.duplicateCacheEntry(cacheKey, cacheSet[index], storeAuthStateInCookie));
    }

    /**
     * Utility function to help with roll back keys
     * @param newKey
     * @param value
     * @param storeAuthStateInCookie
     */
    private duplicateCacheEntry(newKey: string, value: string, storeAuthStateInCookie?: boolean) {
        if (value) {
            this.setItem(newKey, value, storeAuthStateInCookie);
        }
    }

    /**
     * Prepend msal.<client-id> to each key; Skip for any JSON object as Key (defined schemas do not need the key appended: AccessToken Keys or the upcoming schema)
     * @param key
     * @param addInstanceId
     */
    private generateCacheKey(key: string, addInstanceId: boolean): string {
        try {
            JSON.parse(key);
            return key;
        } catch (e) {
            if (key.startsWith(`${Constants.cachePrefix}`) || key.startsWith(Constants.adalIdToken)) {
                return key;
            }
            return addInstanceId ? `${Constants.cachePrefix}.${this.clientId}.${key}` : `${Constants.cachePrefix}.${key}`;
        }
    }

    /**
     * add value to storage
     * @param key
     * @param value
     * @param enableCookieStorage
     */
    setItem(key: string, value: string, enableCookieStorage?: boolean): void {
        super.setItem(this.generateCacheKey(key, true), value, enableCookieStorage);

        if (this.rollbackEnabled) {
            super.setItem(this.generateCacheKey(key, false), value, enableCookieStorage);
        }
    }

    /**
     * get one item by key from storage
     * @param key
     * @param enableCookieStorage
     */
    getItem(key: string, enableCookieStorage?: boolean): string {
        return super.getItem(this.generateCacheKey(key, true), enableCookieStorage);
    }

    /**
     * remove value from storage
     * @param key
     */
    removeItem(key: string): void {
        super.removeItem(this.generateCacheKey(key, true));
        if (this.rollbackEnabled) {
            super.removeItem(this.generateCacheKey(key, false));
        }
    }

    /**
     * Reset the cache items
     */
    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        let key: string;
        for (key in storage) {
            // Check if key contains msal prefix; For now, we are clearing all cache items created by MSAL.js
            if (storage.hasOwnProperty(key) && (key.indexOf(Constants.cachePrefix) !== -1)) {
                super.removeItem(key);
                // TODO: Clear cache based on client id (clarify use cases where this is needed)
            }
        }
    }

    /**
     * Reset all temporary cache items
     */
    resetTempCacheItems(): void {
        const storage = window[this.cacheLocation];
        let key: string;
        for (key in storage) {
            // Check if key contains msal prefix; For now, we are clearing all cache items created by MSAL.js
            if (Object.keys(TemporaryCacheKeys).indexOf(key) > -1) {
                super.removeItem(key);
            }
        }
    }

    /**
     * Set cookies for IE
     * @param cName
     * @param cValue
     * @param expires
     */
    setItemCookie(cName: string, cValue: string, expires?: number): void {
        super.setItemCookie(this.generateCacheKey(cName, true), cValue, expires);
        if (this.rollbackEnabled) {
            super.setItemCookie(this.generateCacheKey(cName, false), cValue, expires);
        }
    }

    /**
     * get one item by key from cookies
     * @param cName
     */
    getItemCookie(cName: string): string {
        return super.getItemCookie(this.generateCacheKey(cName, true));
    }

    /**
     * Get all access tokens in the cache
     * @param clientId
     * @param homeAccountIdentifier
     */
    getAllAccessTokens(clientId: string, homeAccountIdentifier: string): Array<AccessTokenCacheItem> {
        const results = Object.keys(window[this.cacheLocation]).reduce((tokens, key) => {
            if ( window[this.cacheLocation].hasOwnProperty(key) && key.match(clientId) && key.match(homeAccountIdentifier)) {
                const value = this.getItem(key);
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
        const storage = window[this.cacheLocation];
        let key: string;
        for (key in storage) {
            if (storage.hasOwnProperty(key)) {
                if ((key.indexOf(TemporaryCacheKeys.AUTHORITY) !== -1 || key.indexOf(TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT) !== 1) && (!state || key.indexOf(state) !== -1)) {
                    const resourceDelimSplitKey = key.split(Constants.resourceDelimiter);
                    let keyState;
                    if (resourceDelimSplitKey.length > 1) {
                        keyState = resourceDelimSplitKey[resourceDelimSplitKey.length-1];
                    }
                    if (keyState === state && !this.tokenRenewalInProgress(keyState)) {
                        this.removeItem(key);
                        this.removeItem(TemporaryCacheKeys.RENEW_STATUS + state);
                        this.removeItem(TemporaryCacheKeys.STATE_LOGIN);
                        this.removeItem(TemporaryCacheKeys.STATE_ACQ_TOKEN);
                        this.removeItem(TemporaryCacheKeys.LOGIN_REQUEST);
                        this.removeItem(INTERACTION_STATUS);
                        this.removeItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}`);
                        this.setItemCookie(key, "", -1);
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
        const renewStatus = this.getItem(TemporaryCacheKeys.RENEW_STATUS + stateValue);
        return !!(renewStatus && renewStatus === RequestStatus.IN_PROGRESS);
    }

    /**
     * Clear all cookies
     */
    public clearMsalCookie(state?: string): void {
        const nonceKey = state ? `${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}` : TemporaryCacheKeys.NONCE_IDTOKEN;
        this.clearItemCookie(nonceKey);
        this.clearItemCookie(TemporaryCacheKeys.STATE_LOGIN);
        this.clearItemCookie(TemporaryCacheKeys.LOGIN_REQUEST);
        this.clearItemCookie(TemporaryCacheKeys.STATE_ACQ_TOKEN);
    }

    /**
     * Create acquireTokenAccountKey to cache account object
     * @param accountId
     * @param state
     */
    public static generateAcquireTokenAccountKey(accountId: any, state: string): string {
        return `${TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT}${Constants.resourceDelimiter}${accountId}${Constants.resourceDelimiter}${state}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    public static generateAuthorityKey(state: string): string {
        return `${TemporaryCacheKeys.AUTHORITY}${Constants.resourceDelimiter}${state}`;
    }
}
