/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICacheStorage, Constants, PersistentCacheKeys, TemporaryCacheKeys, ErrorCacheKeys } from "msal-common";
import { CacheOptions } from "../app/Configuration";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserConstants } from "../utils/BrowserConstants";

const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;

export class BrowserStorage implements ICacheStorage {

    private cacheConfig: CacheOptions;
    private windowStorage: Storage;

    private clientId: string;
    private rollbackEnabled: boolean;

    constructor(clientId: string, cacheConfig: CacheOptions) {
        this.validateWindowStorage(cacheConfig.cacheLocation);

        this.cacheConfig = cacheConfig;
        this.windowStorage = window[this.cacheConfig.cacheLocation];
        this.clientId = clientId;

        // This is hardcoded to true for now, we will roll this out as a configurable option in the future.
        this.rollbackEnabled = true;

        this.migrateCacheEntries();
    }

    private validateWindowStorage(cacheLocation: string) {
        if (typeof window === "undefined" || !window) {
            throw BrowserAuthError.createNoWindowObjectError();
        }

        const storageSupported = !!window[cacheLocation];
        if (!storageSupported) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError();
        }
    }

    /**
     * Support roll back to old cache schema until the next major release: true by default now
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntries() {

        const idTokenKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ID_TOKEN}`;
        const clientInfoKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
        const errorKey = `${Constants.CACHE_PREFIX}.${ErrorCacheKeys.ERROR}`;
        const errorDescKey = `${Constants.CACHE_PREFIX}.${ErrorCacheKeys.ERROR_DESC}`;

        const idTokenValue = this.getItem(idTokenKey);
        const clientInfoValue = this.getItem(clientInfoKey);
        const errorValue = this.getItem(errorKey);
        const errorDescValue = this.getItem(errorDescKey);

        const values = [idTokenValue, clientInfoValue, errorValue, errorDescValue];
        const keysToMigrate = [PersistentCacheKeys.ID_TOKEN, PersistentCacheKeys.CLIENT_INFO, ErrorCacheKeys.ERROR, ErrorCacheKeys.ERROR_DESC];

        keysToMigrate.forEach((cacheKey, index) => this.migrateCacheEntry(cacheKey, values[index]));
    }

    /**
     * Utility function to help with rollback keys.
     * @param newKey
     * @param value
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntry(newKey: string, value: string) {
        if (value) {
            this.setItem(newKey, value);
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
            this.validateObjectKey(key);
            return key;
        } catch (e) {
            if (key.startsWith(`${Constants.CACHE_PREFIX}`) || key.startsWith(PersistentCacheKeys.ADAL_ID_TOKEN)) {
                return key;
            }
            return addInstanceId ? `${Constants.CACHE_PREFIX}.${this.clientId}.${key}` : `${Constants.CACHE_PREFIX}.${key}`;
        }
    }

    /**
     * Parses key as JSON object, JSON.parse() will throw an error.
     * @param key 
     */
    private validateObjectKey(key: string): void {
        JSON.parse(key);
    }

    setItem(key: string, value: string): void {
        const msalKey = this.generateCacheKey(key, true);
        this.windowStorage.setItem(msalKey, value);
        if (this.rollbackEnabled) {
            this.windowStorage.setItem(this.generateCacheKey(key, false), value);
        }
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.setItemCookie(msalKey, value);
        }
    }
    
    getItem(key: string): string {
        const msalKey = this.generateCacheKey(key, true);
        const itemCookie = this.getItemCookie(msalKey);
        if (this.cacheConfig.storeAuthStateInCookie && itemCookie) {
            return itemCookie;
        }
        return this.windowStorage.getItem(msalKey);
    }
    
    removeItem(key: string): void {
        const msalKey = this.generateCacheKey(key, true);
        this.windowStorage.removeItem(msalKey);
        if (this.rollbackEnabled) {
            this.windowStorage.removeItem(this.generateCacheKey(key, false));
        }
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.clearItemCookie(msalKey);
        }
    }
    
    containsKey(key: string): boolean {
        const msalKey = this.generateCacheKey(key, true);
        return this.windowStorage.hasOwnProperty(msalKey) || this.windowStorage.hasOwnProperty(key);
    }
    
    getKeys(): string[] {
        return Object.keys(this.windowStorage);
    }

    clear(): void {
        let key: string;
        for (key in this.windowStorage) {
            // Check if key contains msal prefix; For now, we are clearing all the cache items created by MSAL.js
            if (this.windowStorage.hasOwnProperty(key) && (key.indexOf(Constants.CACHE_PREFIX) !== -1) && (key.indexOf(this.clientId) !== -1)) {
                this.removeItem(key);
            }
        }
    }

    /**
     * Reset all temporary cache items
     * @param state 
     */
    resetTempCacheItems(state: string): void {
        const storage = window[this.cacheConfig.cacheLocation];
        let key: string;
        // check state and remove associated cache
        for (key in storage) {
            if (!state || key.indexOf(state) !== -1) {
                const splitKey = key.split(Constants.RESOURCE_DELIM);
                const keyState = splitKey.length > 1 ? splitKey[splitKey.length-1]: null;
                if (keyState === state && !this.tokenRenewalInProgress(keyState)) {
                    this.removeItem(key);
                    this.setItemCookie(key, "", -1);
                    this.clearMsalCookie(state);
                }
            }
        }
        // delete the interaction status cache
        this.removeItem(TemporaryCacheKeys.INTERACTION_STATUS);
        this.removeItem(TemporaryCacheKeys.REDIRECT_REQUEST);
    }

    /**
     * Return if the token renewal is still in progress
     * @param stateValue
     */
    private tokenRenewalInProgress(stateValue: string): boolean {
        const renewStatus = this.getItem(`${TemporaryCacheKeys.RENEW_STATUS}|${stateValue}`);
        return !!(renewStatus && renewStatus === BrowserConstants.inProgress);
    }

    /**
     * Add value to cookies
     * @param cookieName
     * @param cookieValue
     * @param expires
     */
    setItemCookie(cookieName: string, cookieValue: string, expires?: number): void {
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
        const cookieList = document.cookie.split(";");
        for (let i = 0; i < cookieList.length; i++) {
            let cookie = cookieList[i];
            while (cookie.charAt(0) === " ") {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return cookie.substring(name.length, cookie.length);
            }
        }
        return "";
    }

    /**
     * Clear an item in the cookies by key
     * @param cookieName
     */
    clearItemCookie(cookieName: string) {
        this.setItemCookie(cookieName, "", -1);
    }

    /**
     * Clear all msal cookies
     */
    clearMsalCookie(state?: string): void {
        const nonceKey = state ? `${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}` : TemporaryCacheKeys.NONCE_IDTOKEN;
        this.clearItemCookie(nonceKey);
        this.clearItemCookie(TemporaryCacheKeys.REQUEST_STATE);
        this.clearItemCookie(TemporaryCacheKeys.ORIGIN_URI);
    }

    /**
     * Get cookie expiration time
     * @param cookieLifeDays
     */
    getCookieExpirationTime(cookieLifeDays: number): string {
        const today = new Date();
        const expr = new Date(today.getTime() + cookieLifeDays * COOKIE_LIFE_MULTIPLIER);
        return expr.toUTCString();
    }
}
