/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, CacheKeys } from "../utils/Constants";
import { CacheLocation } from "../Configuration";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

/**
 * @hidden
 */
export class BrowserStorage {// Singleton

    private static instance: BrowserStorage;
    private localStorageSupported: boolean;
    private sessionStorageSupported: boolean;
    protected cacheLocation: CacheLocation;

    constructor(cacheLocation: CacheLocation) {
        if (BrowserStorage.instance) {
            return BrowserStorage.instance;
        }

        this.cacheLocation = cacheLocation;
        this.localStorageSupported = typeof window[this.cacheLocation] !== "undefined" && window[this.cacheLocation] != null;
        this.sessionStorageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
        BrowserStorage.instance = this;
        if (!this.localStorageSupported && !this.sessionStorageSupported) {
            throw ClientConfigurationError.createNoStorageSupportedError();
        }

        return BrowserStorage.instance;
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

    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        if (storage) {
            let key: string;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.indexOf(CacheKeys.PREFIX) !== -1) {
                        this.removeItem(key);
                    }
                }
            }
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
}
