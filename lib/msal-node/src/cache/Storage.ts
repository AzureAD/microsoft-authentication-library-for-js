/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    ICacheStorage,
    Constants,
    PersistentCacheKeys,
    TemporaryCacheKeys,
} from '@azure/msal-common';
import { CacheOptions } from '../config/Configuration';
import { CACHE } from './../utils/Constants';

const fs = require('fs');

// Cookie life calculation (hours * minutes * seconds * ms)
const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;

/**
 * This class implements the cache storage interface for MSAL through browser local or session storage.
 * Cookies are only used if storeAuthStateInCookie is true, and are only used for
 * parameters such as state and nonce, generally.
 */
export class Storage implements ICacheStorage {
    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    // storage object
    private fileStorage: Storage;
    // Client id of application. Used in cache keys to partition cache correctly in the case of multiple instances of MSAL.
    private clientId: string;

    constructor(clientId: string, cacheConfig: CacheOptions) {
        this.cacheConfig = cacheConfig;
        this.fileStorage = this.initializeFileStorage(
            this.cacheConfig.cacheLocation
        );
        this.clientId = clientId;
    }

    private initializeFileStorage(cacheLocation: string) {
        if (cacheLocation == CACHE.FILE_CACHE) {
            fs.open('NodeCache.txt', 'w', (err: Error) => {
                if (err) throw err;
            });

            return fs;
        }
    }

    /**
     * Prepend msal.<client-id> to each key; Skip for any JSON object as Key (defined schemas do not need the key appended: AccessToken Keys or the upcoming schema)
     * @param key
     * @param addInstanceId
     */
    private generateCacheKey(key: string): string {
        try {
            // Defined schemas do not need the key migrated
            this.validateObjectKey(key);
            return key;
        } catch (e) {
            if (
                key.startsWith(`${Constants.CACHE_PREFIX}`) ||
                key.startsWith(PersistentCacheKeys.ADAL_ID_TOKEN)
            ) {
                return key;
            }
            return `${Constants.CACHE_PREFIX}.${this.clientId}.${key}`;
        }
    }

    /**
     * Parses key as JSON object, JSON.parse() will throw an error.
     * @param key
     */
    private validateObjectKey(key: string): void {
        JSON.parse(key);
    }

    /**
     * Sets the cache item with the key and value given.
     * Stores in cookie if storeAuthStateInCookie is set to true.
     * This can cause cookie overflow if used incorrectly.
     * @param key
     * @param value
     */
    setItem(key: string, value: string): void {
        const msalKey = this.generateCacheKey(key);
        this.fileStorage.setItem(msalKey, value);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.setItemCookie(msalKey, value);
        }
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    getItem(key: string): string {
        const msalKey = this.generateCacheKey(key);
        const itemCookie = this.getItemCookie(msalKey);
        if (this.cacheConfig.storeAuthStateInCookie && itemCookie) {
            return itemCookie;
        }
        return this.fileStorage.getItem(msalKey);
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    removeItem(key: string): void {
        const msalKey = this.generateCacheKey(key);
        this.fileStorage.removeItem(msalKey);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.clearItemCookie(msalKey);
        }
    }

    /**
     * Checks whether key is in cache.
     * @param key
     */
    containsKey(key: string): boolean {
        const msalKey = this.generateCacheKey(key);
        return (
            this.fileStorage.hasOwnProperty(msalKey) ||
            this.fileStorage.hasOwnProperty(key)
        );
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        return Object.keys(this.fileStorage);
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(): void {
        let key: string;
        for (key in this.fileStorage) {
            // Check if key contains msal prefix; For now, we are clearing all the cache items created by MSAL.js
            if (
                this.fileStorage.hasOwnProperty(key) &&
                key.indexOf(Constants.CACHE_PREFIX) !== -1 &&
                key.indexOf(this.clientId) !== -1
            ) {
                this.removeItem(key);
            }
        }
    }

    /**
     * Add value to cookies
     * @param cookieName
     * @param cookieValue
     * @param expires
     */
    setItemCookie(
        cookieName: string,
        cookieValue: string,
        expires?: number
    ): void {
        let cookieStr = `${cookieName}=${cookieValue};path=/;`;
        if (expires) {
            const expireTime = this.getCookieExpirationTime(expires);
            cookieStr += `expires=${expireTime};`;
        }

        document.cookie = cookieStr;
    }

    /**
     * Get one item by key from cookies
     * @param cookieName
     */
    getItemCookie(cookieName: string): string {
        const name = `${cookieName}=`;
        const cookieList = document.cookie.split(';');
        for (let i = 0; i < cookieList.length; i++) {
            let cookie = cookieList[i];
            while (cookie.charAt(0) === ' ') {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return '';
    }

    /**
     * Clear an item in the cookies by key
     * @param cookieName
     */
    clearItemCookie(cookieName: string): void {
        this.setItemCookie(cookieName, '', -1);
    }

    /**
     * Clear all msal cookies
     */
    clearMsalCookie(state?: string): void {
        const nonceKey = state
            ? `${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}`
            : TemporaryCacheKeys.NONCE_IDTOKEN;
        this.clearItemCookie(this.generateCacheKey(nonceKey));
        this.clearItemCookie(
            this.generateCacheKey(TemporaryCacheKeys.REQUEST_STATE)
        );
        this.clearItemCookie(
            this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI)
        );
    }

    /**
     * Get cookie expiration time
     * @param cookieLifeDays
     */
    getCookieExpirationTime(cookieLifeDays: number): string {
        const today = new Date();
        const expr = new Date(
            today.getTime() + cookieLifeDays * COOKIE_LIFE_MULTIPLIER
        );
        return expr.toUTCString();
    }
}
