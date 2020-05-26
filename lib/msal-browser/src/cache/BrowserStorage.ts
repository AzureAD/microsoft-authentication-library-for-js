/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage, Constants, PersistentCacheKeys, InMemoryCache, Account, Authority, StringUtils, AuthorizationCodeRequest, ICrypto } from "@azure/msal-common";
import { CacheOptions } from "../config/Configuration";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserConfigurationAuthError } from "../error/BrowserConfigurationAuthError";
import { BrowserConstants, TemporaryCacheKeys } from "../utils/BrowserConstants";

// Cookie life calculation (hours * minutes * seconds * ms)
const COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;

/**
 * This class implements the cache storage interface for MSAL through browser local or session storage.
 * Cookies are only used if storeAuthStateInCookie is true, and are only used for
 * parameters such as state and nonce, generally.
 */
export class BrowserStorage implements ICacheStorage {

    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    // Window storage object (either local or sessionStorage)
    private windowStorage: Storage;
    // Client id of application. Used in cache keys to partition cache correctly in the case of multiple instances of MSAL.
    private clientId: string;

    constructor(clientId: string, cacheConfig: CacheOptions) {
        // Validate cache location
        this.validateWindowStorage(cacheConfig.cacheLocation);

        this.cacheConfig = cacheConfig;
        this.windowStorage = window[this.cacheConfig.cacheLocation];
        this.clientId = clientId;

        // Migrate any cache entries from older versions of MSAL.
        this.migrateCacheEntries();
    }

    /**
     * Validates the the given cache location string is an expected value:
     * - localStorage
     * - sessionStorage (default)
     * Also validates if given cacheLocation is supported on the browser.
     * @param cacheLocation
     */
    private validateWindowStorage(cacheLocation: string): void {
        if (typeof window === "undefined" || !window) {
            throw BrowserAuthError.createNoWindowObjectError();
        }

        if (cacheLocation !== BrowserConstants.CACHE_LOCATION_LOCAL && cacheLocation !== BrowserConstants.CACHE_LOCATION_SESSION) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }

        const storageSupported = !!window[cacheLocation];
        if (!storageSupported) {
            throw BrowserConfigurationAuthError.createStorageNotSupportedError(cacheLocation);
        }
    }

    /**
     * Migrate all old cache entries to new schema. No rollback supported.
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntries(): void {
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

        keysToMigrate.forEach((cacheKey, index) => this.migrateCacheEntry(cacheKey, values[index]));
    }

    /**
     * Utility function to help with migration.
     * @param newKey
     * @param value
     * @param storeAuthStateInCookie
     */
    private migrateCacheEntry(newKey: string, value: string): void {
        if (value) {
            this.setItem(newKey, value);
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
            if (key.startsWith(`${Constants.CACHE_PREFIX}`) || key.startsWith(PersistentCacheKeys.ADAL_ID_TOKEN)) {
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
        this.windowStorage.setItem(msalKey, value);
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
        return this.windowStorage.getItem(msalKey);
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    removeItem(key: string): void {
        const msalKey = this.generateCacheKey(key);
        this.windowStorage.removeItem(msalKey);
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
        return this.windowStorage.hasOwnProperty(msalKey) || this.windowStorage.hasOwnProperty(key);
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        return Object.keys(this.windowStorage);
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
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
    clearItemCookie(cookieName: string): void {
        this.setItemCookie(cookieName, "", -1);
    }

    /**
     * Clear all msal cookies
     */
    clearMsalCookie(state?: string): void {
        const nonceKey = state ? `${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}` : TemporaryCacheKeys.NONCE_IDTOKEN;
        this.clearItemCookie(this.generateCacheKey(nonceKey));
        this.clearItemCookie(this.generateCacheKey(TemporaryCacheKeys.REQUEST_STATE));
        this.clearItemCookie(this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI));
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

    /**
     * Dummy implementation until browser cache is migrated
     */
    getCache(): InMemoryCache {
        return {
            accounts: {},
            idTokens: {},
            accessTokens: {},
            refreshTokens: {},
            appMetadata: {}
        };
    }

    /**
     * Dummy implementation until browser cache is migrated
     */
    setCache() {
        // sets nothing
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    generateAuthorityKey(state: string): string {
        return `${TemporaryCacheKeys.AUTHORITY}${Constants.RESOURCE_DELIM}${state}`;
    }

    /**
     * Create Nonce key to cache nonce
     * @param state
     */
    generateNonceKey(state: string): string {
        return `${TemporaryCacheKeys.NONCE_IDTOKEN}${Constants.RESOURCE_DELIM}${state}`;
    }

    /**
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     */
    setAuthorityCache(authority: string, state: string): void {
        // Cache authorityKey
        const authorityKey = this.generateAuthorityKey(state);
        this.setItem(authorityKey, authority);
    }

    /**
     * Updates account, authority, and state in cache
     * @param serverAuthenticationRequest
     * @param account
     */
    updateCacheEntries(state: string, nonce: string, authorityInstance: string): void {
        // Cache the request state
        this.setItem(TemporaryCacheKeys.REQUEST_STATE, state);

        // Cache the nonce
        this.setItem(this.generateNonceKey(state), nonce);

        // Cache authorityKey
        this.setAuthorityCache(authorityInstance, state);
    }

    /**
     * Reset all temporary cache items
     * @param state
     */
    resetRequestCache(state: string): void {
        // check state and remove associated cache items
        this.getKeys().forEach(key => {
            if (!StringUtils.isEmpty(state) && key.indexOf(state) !== -1) {
                const splitKey = key.split(Constants.RESOURCE_DELIM);
                const keyState = splitKey.length > 1 ? splitKey[splitKey.length-1]: null;
                if (keyState === state) {
                    this.removeItem(key);
                }
            }
        });

        // delete generic interactive request parameters
        this.removeItem(TemporaryCacheKeys.REQUEST_STATE);
        this.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
        this.removeItem(TemporaryCacheKeys.ORIGIN_URI);
    }

    cleanRequest(): void {
        // Interaction is completed - remove interaction status.
        this.removeItem(BrowserConstants.INTERACTION_STATUS_KEY);
        const cachedState = this.getItem(TemporaryCacheKeys.REQUEST_STATE);
        this.resetRequestCache(cachedState || "");
        this.removeItem(TemporaryCacheKeys.REQUEST_STATE);
    }

    cacheCodeRequest(authCodeRequest: AuthorizationCodeRequest, browserCrypto: ICrypto): void {
        this.setItem(TemporaryCacheKeys.REQUEST_PARAMS, browserCrypto.base64Encode(JSON.stringify(authCodeRequest)));
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    getCachedRequest(state: string, browserCrypto: ICrypto): AuthorizationCodeRequest {
        try {
            // Get token request from cache and parse as TokenExchangeParameters.
            const encodedTokenRequest = this.getItem(TemporaryCacheKeys.REQUEST_PARAMS);
            const parsedRequest = JSON.parse(browserCrypto.base64Decode(encodedTokenRequest)) as AuthorizationCodeRequest;
            this.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
            // Get cached authority and use if no authority is cached with request.
            if (StringUtils.isEmpty(parsedRequest.authority)) {
                const authorityKey: string = this.generateAuthorityKey(state);
                const cachedAuthority: string = this.getItem(authorityKey);
                parsedRequest.authority = cachedAuthority;
            }
            return parsedRequest;
        } catch (err) {
            throw BrowserAuthError.createTokenRequestCacheError(err);
        }
    }
}
