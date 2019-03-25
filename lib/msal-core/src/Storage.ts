/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Constants } from "./Constants";
import { AccessTokenCacheItem } from "./AccessTokenCacheItem";
import { CacheKeys } from "./Constants";

/**
 * @hidden
 */
export class Storage {// Singleton

  private static instance: Storage;
  private localStorageSupported: boolean;
  private sessionStorageSupported: boolean;
  private cacheLocation: string;

  constructor(cacheLocation: string) {
    if (Storage.instance) {
      return Storage.instance;
    }

    this.cacheLocation = cacheLocation;
    this.localStorageSupported = typeof window[this.cacheLocation] !== "undefined" && window[this.cacheLocation] != null;
    this.sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
    Storage.instance = this;
    if (!this.localStorageSupported && !this.sessionStorageSupported) {
      throw new Error("localStorage and sessionStorage not supported");
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

    getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem> {
        const results: Array<AccessTokenCacheItem> = [];
        let accessTokenCacheItem: AccessTokenCacheItem;
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.match(clientId) && key.match(userIdentifier)) {
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

    removeAcquireTokenEntries(authorityKey: string, acquireTokenUserKey: string): void {
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if ((authorityKey !== "" && key.indexOf(authorityKey) > -1) || (acquireTokenUserKey !== "" && key.indexOf(acquireTokenUserKey) > -1)) {
                        this.removeItem(key);
                    }
                }
            }
        }
    }

    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.indexOf(Constants.msal) !== -1) {
                        this.setItem(key, "");
                    }
                    if (key.indexOf(Constants.renewStatus) !== -1) {
                        this.removeItem(key);
                    }
                }
            }
        }
    }

    setItemCookie(cName: string, cValue: string, expires?: number): void {
        let cookieStr = cName + "=" + cValue + ";";
        if (expires) {
            const expireTime = this.setExpirationCookie(expires);
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

    setExpirationCookie(cookieLife: number): string {
        const today = new Date();
        const expr = new Date(today.getTime() + cookieLife * 24 * 60 * 60 * 1000);
        return expr.toUTCString();
    }

    clearCookie(): void {
        this.setItemCookie(Constants.nonceIdToken, "", -1);
        this.setItemCookie(Constants.stateLogin, "", -1);
        this.setItemCookie(Constants.loginRequest, "", -1);
        this.setItemCookie(Constants.stateAcquireToken, "", -1);
    }

    /**
     * Create acquireTokenUserKey to cache user object
     */
    static generateAcquireTokenUserKey(userId: any, state: string): string {
        return CacheKeys.ACQUIRE_TOKEN_USER + Constants.resourceDelimiter +
            `${userId}` + Constants.resourceDelimiter  + `${state}`;
    }

    /**
     * Create authorityKey to cache authority
     */
    static generateAuthorityKey(state: string): string {
        return CacheKeys.AUTHORITY + Constants.resourceDelimiter + `${state}`;
    }
}
