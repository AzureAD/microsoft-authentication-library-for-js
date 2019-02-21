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
import { CacheStorage } from './Configuration';

/** 
 * Singleton Class - Manages the Cache and browser Storage
 * 
 * @hidden
 */
export class Storage {

    private static instance: Storage;
    private localStorageSupported: boolean;
    private sessionStorageSupported: boolean;
    private cacheLocation: CacheStorage;
    private enableCookieStorage: boolean;

    /**
     * Constructor, create a singleton instance of the Storage class
     * 
     * @param cacheLocation 
     */
    constructor(cacheLocation: CacheStorage) {

        // if an exisiting session has storage instance already, return it
        if (Storage.instance) {
            return Storage.instance;
        }

        // create a storage instance and return it
        this.cacheLocation = cacheLocation;
        this.localStorageSupported = typeof window[this.cacheLocation] !== "undefined" && window[this.cacheLocation] != null;
        this.sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
        Storage.instance = this;

        if (!this.localStorageSupported && !this.sessionStorageSupported) {
            throw new Error("localStorage and sessionStorage not supported");
        }

        return Storage.instance;
    }


    /**
     * sets the cookie storage setting
     * 
     * @param enableCookieStorage 
     */
    setEnableCookieStorage(enableCookieStorage: boolean) {
        this.enableCookieStorage = enableCookieStorage;
    }


    /**
     * Returns the cookie storage setting
     */
    getEnableCookieStorage() {
        return this.enableCookieStorage;
    }

    /**
     * add value to storage
     * 
     * @param key 
     * @param value 
     * @param enableCookieStorage 
     */
    setItem(key: string, value: string): void {
        if (window[this.cacheLocation]) {
            window[this.cacheLocation].setItem(key, value);
        }
        if (this.enableCookieStorage) {
            this.setItemCookie(key, value);
        }
    }

    /**
     * get one item by key from storage
     * 
     * @param key 
     * @param enableCookieStorage 
     */
    getItem(key: string): string {

        // if stored in cookies, return
        if (this.enableCookieStorage && this.getItemCookie(key)) {
            return this.getItemCookie(key);
        }

        // return from "localStorage" or "sessionStorage"
         if (window[this.cacheLocation]) {
            return window[this.cacheLocation].getItem(key);
        }

        return null;
    }

    
    /**
     * remove value from storage
     * 
     * @param key 
     */
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

    // retrieve all access tokens from the storage
    getAllAccessTokens(clientId: string, userIdentifier: string): Array<AccessTokenCacheItem> {
        const results: Array<AccessTokenCacheItem> = [];
        let accessTokenCacheItem: AccessTokenCacheItem;
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.match(clientId) && key.match(userIdentifier)) {
                        let value = this.getItem(key);
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

    // remove all acquire token entries from the storage
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

    // reset all cache
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
        var cookieStr = cName + "=" + cValue + ";";
        if (expires) {
            var expireTime = this.setExpirationCookie(expires);
            cookieStr += "expires=" + expireTime + ";";
        }

        document.cookie = cookieStr;
    }

    
    getItemCookie(cName: string): string {
        var name = cName + "=";
        var ca = document.cookie.split(";");
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
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
        var today = new Date();
        var expr = new Date(today.getTime() + cookieLife * 24 * 60 * 60 * 1000);
        return expr.toUTCString();
    }

    clearCookie(): void {
        this.setItemCookie(Constants.nonceIdToken, "", -1);
        this.setItemCookie(Constants.stateLogin, "", -1);
        this.setItemCookie(Constants.loginRequest, "", -1);
        this.setItemCookie(Constants.stateAcquireToken, "", -1);
    }
}
