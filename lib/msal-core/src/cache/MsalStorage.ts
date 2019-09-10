/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, CacheKeys } from "../utils/Constants";
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { CacheLocation } from "../Configuration";
import { AuthStorage } from "./AuthStorage";

const PREFIX = "msal";

/**
 * @hidden
 */
export class MsalStorage extends AuthStorage {// Singleton
    
    private clientId: string;
    
    constructor(clientId: string, cacheLocation: CacheLocation) {
        super(cacheLocation);
        this.clientId = clientId;
    }

    // Prepend msal.<client-id> to each key
    private generateCacheKey(key: string): string {
        return `${PREFIX}.${this.clientId}.${key}`;
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
                            this.removeItem(Constants.renewStatus + state);
                            this.removeItem(Constants.stateLogin);
                            this.removeItem(Constants.stateAcquireToken);
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
        const renewStatus = storage[Constants.renewStatus + stateValue];
        return !(!renewStatus || renewStatus !== Constants.tokenRenewStatusInProgress);
    }

    public clearMsalCookie(): void {
        this.setItemCookie(Constants.nonceIdToken, "", -1);
        this.setItemCookie(Constants.stateLogin, "", -1);
        this.setItemCookie(Constants.loginRequest, "", -1);
        this.setItemCookie(Constants.stateAcquireToken, "", -1);
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
