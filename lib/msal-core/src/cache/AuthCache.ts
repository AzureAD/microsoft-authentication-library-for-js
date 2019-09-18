/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, PersistentCacheKeys, TemporaryCacheKeys } from "../utils/Constants";
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

    private migrateCacheEntries(storeAuthStateInCookie: boolean) {
        const idTokenKey = `${Constants.cachePrefix}.${PersistentCacheKeys.IDTOKEN}`;
        const clientInfoKey = `${Constants.cachePrefix}.${PersistentCacheKeys.CLIENT_INFO}`;
        const errorKey = `${Constants.cachePrefix}.${PersistentCacheKeys.ERROR}`;
        const errorDescKey = `${Constants.cachePrefix}.${PersistentCacheKeys.ERROR_DESC}`;
        
        const idTokenValue = super.getItem(idTokenKey);
        const clientInfoValue = super.getItem(clientInfoKey);
        const errorValue = super.getItem(errorKey);
        const errorDescValue = super.getItem(errorDescKey);
        const values = [idTokenValue, clientInfoValue, errorValue, errorDescValue];
        const keysToMigrate = [PersistentCacheKeys.IDTOKEN, PersistentCacheKeys.CLIENT_INFO, PersistentCacheKeys.ERROR, PersistentCacheKeys.ERROR_DESC];

        keysToMigrate.forEach((cacheKey, index) => this.duplicateCacheEntry(cacheKey, values[index], storeAuthStateInCookie));
    }

    private duplicateCacheEntry(newKey: string, value: string, storeAuthStateInCookie?: boolean) {
        if (value) {
            this.setItem(newKey, value, storeAuthStateInCookie);
        }
    }

    // Prepend msal.<client-id> to each key
    private generateCacheKey(key: string, addInstanceId: boolean): string {
        try {
            JSON.parse(key);
            return key;
        } catch (e) {
            if (key.startsWith(`${Constants.cachePrefix}.${this.clientId}`) || key.startsWith(PersistentCacheKeys.ADAL_ID_TOKEN)) {
                return key;
            } else {
                return addInstanceId ? `${Constants.cachePrefix}.${this.clientId}.${key}` : `${Constants.cachePrefix}.${key}`;
            }
        }
    }

    // add value to storage
    setItem(key: string, value: string, enableCookieStorage?: boolean): void {
        super.setItem(this.generateCacheKey(key, true), value, enableCookieStorage);

        if (this.rollbackEnabled) {
            super.setItem(this.generateCacheKey(key, false), value, enableCookieStorage);
        }
    }

    // get one item by key from storage
    getItem(key: string, enableCookieStorage?: boolean): string {
        return super.getItem(this.generateCacheKey(key, true), enableCookieStorage);
    }

    // remove value from storage
    removeItem(key: string): void {
        super.removeItem(this.generateCacheKey(key, true));
        if (this.rollbackEnabled) {
            super.removeItem(this.generateCacheKey(key, false));
        }
    }

    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        let key: string;
        for (key in storage) {
            if (storage.hasOwnProperty(key)) {
                // Check if key contains msal prefix
                if (key.indexOf(Constants.cachePrefix) !== -1) {
                    // For now, we are clearing all cache items created by MSAL.js
                    super.removeItem(key);
                    // TODO: Clear cache based on client id (clarify use cases where this is needed)
                }
            }
        }
    }

    setItemCookie(cName: string, cValue: string, expires?: number): void {
        super.setItemCookie(this.generateCacheKey(cName, true), cValue, expires);
        if (this.rollbackEnabled) {
            super.setItemCookie(this.generateCacheKey(cName, false), cValue, expires);
        }
    }

    getItemCookie(cName: string): string {
        return super.getItemCookie(this.generateCacheKey(cName, true));
    }

    getAllAccessTokens(clientId: string, homeAccountIdentifier: string): Array<AccessTokenCacheItem> {
        const results: Array<AccessTokenCacheItem> = [];
        let accessTokenCacheItem: AccessTokenCacheItem;
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.match(clientId) && key.match(homeAccountIdentifier)) {
                        const value = this.getItem(key);
                        if (value) {
                            accessTokenCacheItem = new AccessTokenCacheItem(JSON.parse(key), JSON.parse(value));
                            results.push(accessTokenCacheItem);
                        }
                    }
                }
            }
        }

        return results;
    }

    removeAcquireTokenEntries(state: string): void {
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
                        this.removeItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}`);
                        this.setItemCookie(key, "", -1);
                        this.clearMsalCookie(state);
                    }
                }
            }
        }
    }

    private tokenRenewalInProgress(stateValue: string): boolean {
        const storage = window[this.cacheLocation];
        const renewStatus = storage[TemporaryCacheKeys.RENEW_STATUS + stateValue];
        return !(!renewStatus || renewStatus !== Constants.tokenRenewStatusInProgress);
    }

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
        return TemporaryCacheKeys.ACQUIRE_TOKEN_ACCOUNT + Constants.resourceDelimiter +
            `${accountId}` + Constants.resourceDelimiter  + `${state}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    public static generateAuthorityKey(state: string): string {
        return TemporaryCacheKeys.AUTHORITY + Constants.resourceDelimiter + `${state}`;
    }
}
