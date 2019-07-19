// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Constants } from "./Constants";
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { CacheLocation } from "./Configuration";
import { CacheKeys } from "./Constants";
import { ClientConfigurationError } from "./error/ClientConfigurationError";

/**
 * @hidden
 */
export class Storage {// Singleton

  private static instance: Storage;
  private localStorageSupported: boolean;
  private sessionStorageSupported: boolean;
  private cacheLocation: CacheLocation;

  constructor(cacheLocation: CacheLocation) {
    if (Storage.instance) {
      return Storage.instance;
    }

    this.cacheLocation = cacheLocation;
    this.localStorageSupported = typeof window[this.cacheLocation] !== "undefined" && window[this.cacheLocation] != null;
    this.sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
    Storage.instance = this;
    if (!this.localStorageSupported && !this.sessionStorageSupported) {
      throw ClientConfigurationError.createNoStorageSupportedError();
    }

    return Storage.instance;
  }

    // add value to storage
    setItem(key: string, value: string, enableCookieStorage?: boolean): void {
        if (window[this.cacheLocation]) {
            window[this.cacheLocation].setItem(key, value);
        }
        if (enableCookieStorage) {
            this.setItemCookie(key, value);
        }
    }

    // get one item by key from storage
    getItem(key: string, enableCookieStorage?: boolean): string {
        if (enableCookieStorage && this.getItemCookie(key)) {
            return this.getItemCookie(key);
        }
        if (window[this.cacheLocation]) {
            return window[this.cacheLocation].getItem(key);
        }
        return null;
    }

    // remove value from storage
    removeItem(key: string): void {
        if (window[this.cacheLocation]) {
            return window[this.cacheLocation].removeItem(key);
        }
    }

    // clear storage (remove all items from it)
    clear(): void {
        if (window[this.cacheLocation]) {
            return window[this.cacheLocation].clear();
        }
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

        this.clearCookie();
    }

    private tokenRenewalInProgress(stateValue: string): boolean {
        const storage = window[this.cacheLocation];
        const renewStatus = storage[Constants.renewStatus + stateValue];
        return !(!renewStatus || renewStatus !== Constants.tokenRenewStatusInProgress);
    }

    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.indexOf(Constants.msal) !== -1) {
                        this.removeItem(key);
                    }
                }
            }
            this.removeAcquireTokenEntries();
        }
    }

    setItemCookie(cName: string, cValue: string, expires?: number): void {
        let cookieStr = cName + "=" + cValue + ";";
        if (expires) {
            const expireTime = this.getCookieExpirationTime(expires);
            cookieStr += "expires=" + expireTime + ";";
        }

        document.cookie = cookieStr;
    }

    getItemCookie(cName: string): string {
        const name = cName + "=";
        const ca = document.cookie.split(";");
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    getCookieExpirationTime(cookieLifeDays: number): string {
        const today = new Date();
        const expr = new Date(today.getTime() + cookieLifeDays * 24 * 60 * 60 * 1000);
        return expr.toUTCString();
    }

    clearCookie(): void {
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
    static generateAcquireTokenAccountKey(accountId: any, state: string): string {
        return CacheKeys.ACQUIRE_TOKEN_ACCOUNT + Constants.resourceDelimiter +
            `${accountId}` + Constants.resourceDelimiter  + `${state}`;
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    static generateAuthorityKey(state: string): string {
        return CacheKeys.AUTHORITY + Constants.resourceDelimiter + `${state}`;
    }
}
