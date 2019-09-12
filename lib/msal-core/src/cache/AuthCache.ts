/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, CacheKeys } from "../utils/Constants";
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { CacheLocation } from "../Configuration";
import { BrowserStorage } from "./BrowserStorage";

/**
 * @hidden
 */
export class AuthCache extends BrowserStorage {// Singleton
    
    private clientId: string;
    
    constructor(clientId: string, cacheLocation: CacheLocation, storeAuthStateInCookie: boolean) {
        super(cacheLocation);
        this.clientId = clientId;
        this.migrateCacheEntries(storeAuthStateInCookie);
    }

    private migrateCacheEntries(storeAuthStateInCookie: boolean) {
        const idTokenKey = `${CacheKeys.PREFIX}.${CacheKeys.IDTOKEN}`;
        const clientInfoKey = `${CacheKeys.PREFIX}.${CacheKeys.CLIENT_INFO}`;
        const errorKey = `${CacheKeys.PREFIX}.${CacheKeys.ERROR}`;
        const errorDescKey = `${CacheKeys.PREFIX}.${CacheKeys.ERROR_DESC}`;
        
        const idTokenValue = super.getItem(idTokenKey);
        const clientInfoValue = super.getItem(clientInfoKey);
        const errorValue = super.getItem(errorKey);
        const errorDescValue = super.getItem(errorDescKey);
        const values = [idTokenValue, clientInfoValue, errorValue, errorDescValue];
        const keysToMigrate = [CacheKeys.IDTOKEN, CacheKeys.CLIENT_INFO, CacheKeys.ERROR, CacheKeys.ERROR_DESC];

        keysToMigrate.forEach((cacheKey, index) => this.replaceCacheEntry(`${CacheKeys.PREFIX}.${cacheKey}`, cacheKey, values[index], storeAuthStateInCookie));
    }

    private replaceCacheEntry(oldKey: string, newKey: string, value: string, storeAuthStateInCookie?: boolean) {
        if (value) {
            super.removeItem(oldKey);
            this.setItem(newKey, value, storeAuthStateInCookie);
        }
    }

    // Prepend msal.<client-id> to each key
    private generateCacheKey(key: string): string {
        try {
            JSON.parse(key);
            return key;
        } catch (e) {
            return `${CacheKeys.PREFIX}.${this.clientId}.${key}`;
        }
    }

    // add value to storage
    setItem(key: string, value: string, enableCookieStorage?: boolean): void {
        super.setItem(this.generateCacheKey(key), value, enableCookieStorage);
    }

    // get one item by key from storage
    getItem(key: string, enableCookieStorage?: boolean): string {
        return super.getItem(this.generateCacheKey(key), enableCookieStorage);
    }

    // remove value from storage
    removeItem(key: string): void {
        super.removeItem(this.generateCacheKey(key));
    }

    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        if (storage) {
            super.resetCacheItems();
            this.removeAcquireTokenEntries();
        }
    }

    setItemCookie(cName: string, cValue: string, expires?: number): void {
        super.setItemCookie(this.generateCacheKey(cName), cValue, expires);
    }

    getItemCookie(cName: string): string {
        return super.getItemCookie(this.generateCacheKey(cName));
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

    removeAcquireTokenEntries(state?: string): void {
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if ((key.indexOf(CacheKeys.AUTHORITY) !== -1 || key.indexOf(CacheKeys.ACQUIRE_TOKEN_ACCOUNT) !== 1) && (!state || key.indexOf(state) !== -1)) {
                        const splitKey = key.split(Constants.resourceDelimiter);
                        let state;
                        if (splitKey.length > 1) {
                            state = splitKey[1];
                        }
                        if (state && !this.tokenRenewalInProgress(state)) {
                            this.removeItem(key);
                            this.removeItem(CacheKeys.RENEW_STATUS + state);
                            this.removeItem(CacheKeys.STATE_LOGIN);
                            this.removeItem(CacheKeys.STATE_ACQ_TOKEN);
                            this.setItemCookie(key, "", -1);
                        }
                    }
                }
            }
        }

        this.clearMsalCookie();
    }

    private tokenRenewalInProgress(stateValue: string): boolean {
        const storage = window[this.cacheLocation];
        const renewStatus = storage[CacheKeys.RENEW_STATUS + stateValue];
        return !(!renewStatus || renewStatus !== Constants.tokenRenewStatusInProgress);
    }

    public clearMsalCookie(): void {
        this.setItemCookie(CacheKeys.NONCE_IDTOKEN, "", -1);
        this.setItemCookie(CacheKeys.STATE_LOGIN, "", -1);
        this.setItemCookie(CacheKeys.LOGIN_REQUEST, "", -1);
        this.setItemCookie(CacheKeys.STATE_ACQ_TOKEN, "", -1);
    }

    /**
     * Create acquireTokenAccountKey to cache account object
     * @param accountId
     * @param state
     */
    public static generateAcquireTokenAccountKey(accountId: any, state: string): string {
        return CacheKeys.ACQUIRE_TOKEN_ACCOUNT + Constants.resourceDelimiter +
            `${accountId}` + Constants.resourceDelimiter  + `${state}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    public static generateAuthorityKey(state: string): string {
        return CacheKeys.AUTHORITY + Constants.resourceDelimiter + `${state}`;
    }
}
