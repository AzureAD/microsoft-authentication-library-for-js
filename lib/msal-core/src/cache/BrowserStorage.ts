/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheKeys } from "../utils/Constants";
import { CacheLocation } from "../Configuration";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { AuthError } from "../error/AuthError";

/**
 * @hidden
 */
export class BrowserStorage {// Singleton

    protected cacheLocation: CacheLocation;

    constructor(cacheLocation: CacheLocation) {
        if (!window) {
            throw AuthError.createNoWindowObjectError("Browser storage class could not find window object");
        }

        const storageSupported = typeof window[cacheLocation] !== "undefined" && window[cacheLocation] != null;
        if (!storageSupported) {
            throw ClientConfigurationError.createStorageNotSupportedError(cacheLocation);
        }
        this.cacheLocation = cacheLocation;
    }

    // add value to storage
    setItem(key: string, value: string, enableCookieStorage?: boolean): void {
        window[this.cacheLocation].setItem(key, value);
        if (enableCookieStorage) {
            this.setItemCookie(key, value);
        }
    }

    // get one item by key from storage
    getItem(key: string, enableCookieStorage?: boolean): string {
        if (enableCookieStorage && this.getItemCookie(key)) {
            return this.getItemCookie(key);
        }
        return window[this.cacheLocation].getItem(key);
    }

    // remove value from storage
    removeItem(key: string): void {
        return window[this.cacheLocation].removeItem(key);
    }

    // clear storage (remove all items from it)
    clear(): void {
        return window[this.cacheLocation].clear();
    }

    resetCacheItems(): void {
        const storage = window[this.cacheLocation];
        let key: string;
        for (key in storage) {
            if (storage.hasOwnProperty(key)) {
                if (key.indexOf(CacheKeys.PREFIX) !== -1) {
                    this.removeItem(key);
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

    clearItemCookie(cName: string) {
        this.setItemCookie(cName, "", -1);
    }

    getCookieExpirationTime(cookieLifeDays: number): string {
        const today = new Date();
        const expr = new Date(today.getTime() + cookieLifeDays * 24 * 60 * 60 * 1000);
        return expr.toUTCString();
    }
}
