/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICacheStorage, AuthError, Constants, PersistentCacheKeys, TemporaryCacheKeys } from "msal-common";
import { CacheLocation, CacheOptions } from "../app/Configuration";
import { ClientBrowserConfigurationError } from "../error/ClientBrowserConfigurationError";

/**
 * @hidden
 */
export class BrowserStorage implements ICacheStorage {

    protected cacheLocation: CacheLocation;
    private windowStorage: Storage;

    private clientId: string;
    private rollbackEnabled: boolean;

    constructor(clientId: string, cacheConfig: CacheOptions) {
        if (!window) {
            throw AuthError.createNoWindowObjectError("Browser storage class could not find window object");
        }

        const storageSupported = typeof window[cacheConfig.cacheLocation] !== "undefined" && window[cacheConfig.cacheLocation] != null;
        if (!storageSupported) {
            throw ClientBrowserConfigurationError.createStorageNotSupportedError(cacheConfig.cacheLocation);
        }
        this.cacheLocation = cacheConfig.cacheLocation;
        this.windowStorage = window[this.cacheLocation];

        this.clientId = clientId;
        // This is hardcoded to true for now. We may make this configurable in the future
        this.rollbackEnabled = true;

        this.migrateCacheEntries(cacheConfig.storeAuthStateInCookie);
    }

    /**
     * Support roll back to old cache schema until the next major release: true by default now
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntries(storeAuthStateInCookie: boolean) {

        const idTokenKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ID_TOKEN}`;
        const clientInfoKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
        const errorKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR}`;
        const errorDescKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR_DESC}`;

        const idTokenValue = this.getItem(idTokenKey);
        const clientInfoValue = this.getItem(clientInfoKey);
        const errorValue = this.getItem(errorKey);
        const errorDescValue = this.getItem(errorDescKey);

        const values = [idTokenValue, clientInfoValue, errorValue, errorDescValue];
        const keysToMigrate = [PersistentCacheKeys.ID_TOKEN, PersistentCacheKeys.CLIENT_INFO, PersistentCacheKeys.ERROR, PersistentCacheKeys.ERROR_DESC];

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
            // Defined schemas do not need the key appended
            JSON.parse(key);
            return key;
        } catch (e) {
            if (key.startsWith(`${Constants.CACHE_PREFIX}`) || key.startsWith(PersistentCacheKeys.ADAL_ID_TOKEN)) {
                return key;
            }
            return addInstanceId ? `${Constants.CACHE_PREFIX}.${this.clientId}.${key}` : `${Constants.CACHE_PREFIX}.${key}`;
        }
    }

    setItem(key: string, value: string, enableCookieStorage?: boolean): void {
        this.windowStorage.setItem(this.generateCacheKey(key, true), value);
        if (this.rollbackEnabled) {
            this.windowStorage.setItem(this.generateCacheKey(key, false), value);
        }
        if (enableCookieStorage) {
            this.setItemCookie(key, value);
        }
        return;
    }

    getItem(key: string, enableCookieStorage?: boolean): string {
        const itemCookie = this.getItemCookie(key);
        if (enableCookieStorage && itemCookie) {
            return itemCookie;
        }
        return this.windowStorage.getItem(this.generateCacheKey(key, true));
    }

    removeItem(key: string, enableCookieStorage?: boolean): void {
        this.windowStorage.removeItem(this.generateCacheKey(key, true));
        if (this.rollbackEnabled) {
            this.windowStorage.removeItem(this.generateCacheKey(key, false));
        }
        if (enableCookieStorage) {
            this.setItemCookie(key, "", -1);
        }
    }

    clear(): void {
        this.resetCacheItems();
    }

    containsKey(key: string): boolean {
        return this.windowStorage.hasOwnProperty(key);
    }

    getKeys(): string[] {
        return Object.keys(this.windowStorage);
    }

    /**
     * Reset the cache items relating to the current state, or all msal items.
     */
    resetCacheItems(state?: string): void {
        let key: string;
        for (key in this.windowStorage) {
            // Check if key contains msal prefix; For now, we are clearing all cache items created by MSAL.js
            if (this.windowStorage.hasOwnProperty(key) && (key.indexOf(Constants.CACHE_PREFIX) !== -1)) {
                this.removeItem(key);
                // TODO: Clear cache based on client id (clarify use cases where this is needed)
            }
        }
    }

    /**
     * add value to cookies
     * @param cName
     * @param cValue
     * @param expires
     */
    setItemCookie(cName: string, cValue: string, expires?: number): void {
        let cookieStr = cName + "=" + cValue + ";";
        if (expires) {
            const expireTime = this.getCookieExpirationTime(expires);
            cookieStr += "expires=" + expireTime + ";";
        }

        document.cookie = cookieStr;
    }

    /**
     * get one item by key from cookies
     * @param cName
     */
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

    /**
     * Clear an item in the cookies by key
     * @param cName
     */
    clearItemCookie(cName: string) {
        this.setItemCookie(cName, "", -1);
    }

    /**
     * Clear all msal cookies
     */
    public clearMsalCookie(state?: string): void {
        const nonceKey = state ? `${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}` : TemporaryCacheKeys.NONCE_IDTOKEN;
        this.clearItemCookie(nonceKey);
        this.clearItemCookie(TemporaryCacheKeys.REQUEST_STATE);
        this.clearItemCookie(TemporaryCacheKeys.REQUEST_URI);
    }

    /**
     * Get cookie expiration time
     * @param cookieLifeDays
     */
    getCookieExpirationTime(cookieLifeDays: number): string {
        const today = new Date();
        const expr = new Date(today.getTime() + cookieLifeDays * 24 * 60 * 60 * 1000);
        return expr.toUTCString();
    }
}
