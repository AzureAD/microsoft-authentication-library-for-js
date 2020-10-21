/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, PersistentCacheKeys, StringUtils, AuthorizationCodeRequest, ICrypto, AccountEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, AppMetadataEntity, CacheManager, ServerTelemetryEntity, ThrottlingEntity, ProtocolUtils } from "@azure/msal-common";
import { CacheOptions } from "../config/Configuration";
import { CryptoOps } from "../crypto/CryptoOps";
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
export class BrowserStorage extends CacheManager {

    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    // Window storage object (either local or sessionStorage)
    private windowStorage: Storage;
    // Client id of application. Used in cache keys to partition cache correctly in the case of multiple instances of MSAL.
    private clientId: string;
    private cryptoImpl: CryptoOps;

    constructor(clientId: string, cacheConfig: CacheOptions, cryptoImpl: CryptoOps) {
        super();
        // Validate cache location
        this.validateWindowStorage(cacheConfig.cacheLocation);

        this.cacheConfig = cacheConfig;
        this.windowStorage = window[this.cacheConfig.cacheLocation];
        this.clientId = clientId;
        this.cryptoImpl = cryptoImpl;

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

        const idTokenValue = this.windowStorage.getItem(idTokenKey);
        const clientInfoValue = this.windowStorage.getItem(clientInfoKey);
        const errorValue = this.windowStorage.getItem(errorKey);
        const errorDescValue = this.windowStorage.getItem(errorDescKey);

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
            this.setTemporaryCache(newKey, value, true);
        }
    }

    /**
     * Parses passed value as JSON object, JSON.parse() will throw an error.
     * @param input
     */
    private IsJSON(jsonValue: string): void {
        JSON.parse(jsonValue);
    }

    /**
     * fetches the entry from the browser storage based off the key
     * @param key
     */
    getItem(key: string): string {
        return this.windowStorage.getItem(key);
    }

    /**
     * sets the entry in the browser storage
     * @param key
     * @param value
     */
    setItem(key: string, value: string): void {
        this.windowStorage.setItem(key, value);
    }

    /**
     * fetch the account entity from the platform cache
     * @param key
     */
    getAccount(key: string): AccountEntity | null {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }

        try {
            this.IsJSON(value);
            const account = CacheManager.toObject(new AccountEntity(), JSON.parse(value));
            if (AccountEntity.isAccountEntity(account)) {
                return account;
            }
            return null;
        } catch (e) {
            return null;
        }
    }

    /**
     * set account entity in the platform cache
     * @param key
     * @param value
     */
    setAccount(key: string, value: AccountEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * generates idToken entity from a string
     * @param value
     */
    getIdTokenCredential(key: string): IdTokenEntity {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        const idToken: IdTokenEntity = CacheManager.toObject(new IdTokenEntity(), JSON.parse(value));
        return idToken;
    }

    /**
     * set IdToken credential to the platform cache
     * @param key
     * @param value
     */
    setIdTokenCredential(key: string, value: IdTokenEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * generates accessToken entity from a string
     * @param value
     */
    getAccessTokenCredential(key: string): AccessTokenEntity {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        const accessToken: AccessTokenEntity = CacheManager.toObject(new AccessTokenEntity(), JSON.parse(value));
        return accessToken;
    }

    /**
     * set accessToken credential to the platform cache
     * @param key
     * @param value
     */
    setAccessTokenCredential(key: string, value: AccessTokenEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * generates refreshToken entity from a string
     * @param value
     */
    getRefreshTokenCredential(key: string): RefreshTokenEntity {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        const refreshToken: RefreshTokenEntity = CacheManager.toObject(new RefreshTokenEntity(), JSON.parse(value));
        return refreshToken;
    }

    /**
     * set refreshToken credential to the platform cache
     * @param key
     * @param value
     */
    setRefreshTokenCredential(key: string, value: RefreshTokenEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param key
     */
    getAppMetadata(key: string): AppMetadataEntity {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        const appMetadata: AppMetadataEntity = CacheManager.toObject(new AppMetadataEntity(), JSON.parse(value));
        if (AppMetadataEntity.isAppMetadataEntity(key, appMetadata)) {
            return appMetadata;
        }
        return null;

    }

    /**
     * set appMetadata entity to the platform cache
     * @param key
     * @param value
     */
    setAppMetadata(key: string, value: AppMetadataEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param key
     */
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        const serverTelemetryEntity = CacheManager.toObject(new ServerTelemetryEntity(), JSON.parse(value));
        if (ServerTelemetryEntity.isServerTelemetryEntity(key, serverTelemetryEntity)) {
            return serverTelemetryEntity;
        }
        return null;
    }

    /**
     * set server telemetry entity to the platform cache
     * @param key
     * @param value
     */
    setServerTelemetry(key: string, value: ServerTelemetryEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * fetch throttling entity from the platform cache
     * @param key
     */
    getThrottlingCache(key: string): ThrottlingEntity | null {
        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        const throttlingCache = CacheManager.toObject(new ThrottlingEntity(), JSON.parse(value));

        if (ThrottlingEntity.isThrottlingEntity(key, throttlingCache)) {
            return throttlingCache;
        }
        return null;
    }

    /**
     * set throttling entity to the platform cache
     * @param key
     * @param value
     */
    setThrottlingCache(key: string, value: ThrottlingEntity): void {
        this.setItem(key, JSON.stringify(value));
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    getTemporaryCache(cacheKey: string, generateKey?: boolean): string {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;

        const itemCookie = this.getItemCookie(key);
        if (this.cacheConfig.storeAuthStateInCookie && itemCookie) {
            return itemCookie;
        }

        const value = this.getItem(key);
        if (StringUtils.isEmpty(value)) {
            return null;
        }
        return value;
    }

    /**
     * Sets the cache item with the key and value given.
     * Stores in cookie if storeAuthStateInCookie is set to true.
     * This can cause cookie overflow if used incorrectly.
     * @param key
     * @param value
     */
    setTemporaryCache(cacheKey: string, value: string, generateKey?: boolean): void {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;

        this.setItem(key, value);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.setItemCookie(key, value);
        }
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    removeItem(key: string): boolean {
        this.windowStorage.removeItem(key);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.clearItemCookie(key);
        }
        return true;
    }

    /**
     * Checks whether key is in cache.
     * @param key
     */
    containsKey(key: string): boolean {
        return this.windowStorage.hasOwnProperty(key);
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
        this.removeAllAccounts();
        this.removeAppMetadata();
        let key: string;
        for (key in this.windowStorage) {
            // Check if key contains msal prefix; For now, we are clearing all the cache items created by MSAL.js
            if (this.windowStorage.hasOwnProperty(key) && ((key.indexOf(Constants.CACHE_PREFIX) !== -1) || (key.indexOf(this.clientId) !== -1))) {
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
        let cookieStr = `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)};path=/;`;
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
        const name = `${encodeURIComponent(cookieName)}=`;
        const cookieList = document.cookie.split(";");
        for (let i = 0; i < cookieList.length; i++) {
            let cookie = cookieList[i];
            while (cookie.charAt(0) === " ") {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return decodeURIComponent(cookie.substring(name.length, cookie.length));
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
    clearMsalCookie(stateString?: string): void {
        const nonceKey = stateString ? this.generateNonceKey(stateString) : this.generateStateKey(TemporaryCacheKeys.NONCE_IDTOKEN);
        this.clearItemCookie(this.generateStateKey(stateString));
        this.clearItemCookie(nonceKey);
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
     * Gets the cache object referenced by the browser
     */
    getCache(): object {
        return this.windowStorage;
    }

    /**
     * interface compat, we cannot overwrite browser cache; Functionality is supported by individual entities in browser
     */
    setCache(): void {
        // sets nothing
    }

    /**
     * Prepend msal.<client-id> to each key; Skip for any JSON object as Key (defined schemas do not need the key appended: AccessToken Keys or the upcoming schema)
     * @param key
     * @param addInstanceId
     */
    generateCacheKey(key: string): string {
        try {
            // Defined schemas do not need the key migrated
            this.IsJSON(key);
            return key;
        } catch (e) {
            if (StringUtils.startsWith(key, Constants.CACHE_PREFIX) || StringUtils.startsWith(key, PersistentCacheKeys.ADAL_ID_TOKEN)) {
                return key;
            }
            return `${Constants.CACHE_PREFIX}.${this.clientId}.${key}`;
        }
    }

    /**
     * Create authorityKey to cache authority
     * @param state
     */
    generateAuthorityKey(stateString: string): string {
        const {
            libraryState: {
                id: stateId
            }
        } = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString);

        return this.generateCacheKey(`${TemporaryCacheKeys.AUTHORITY}.${stateId}`);
    }

    /**
     * Create Nonce key to cache nonce
     * @param state
     */
    generateNonceKey(stateString: string): string {
        const {
            libraryState: {
                id: stateId
            }
        } = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString);

        return this.generateCacheKey(`${TemporaryCacheKeys.NONCE_IDTOKEN}.${stateId}`);
    }

    /**
     * Creates full cache key for the request state
     * @param stateString State string for the request
     */
    generateStateKey(stateString: string): string {
        // Use the library state id to key temp storage for uniqueness for multiple concurrent requests
        const {
            libraryState: {
                id: stateId
            }
        } = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString);

        return this.generateCacheKey(`${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`);
    }

    /**
     * Sets the cacheKey for and stores the authority information in cache
     * @param state
     * @param authority
     */
    setAuthorityCache(authority: string, state: string): void {
        // Cache authorityKey
        const authorityCacheKey = this.generateAuthorityKey(state);
        this.setItem(authorityCacheKey, authority);
    }

    /**
     * Gets the cached authority based on the cached state. Returns empty if no cached state found.
     */
    getCachedAuthority(cachedState: string): string {
        const stateCacheKey = this.generateStateKey(cachedState);
        const state = this.getTemporaryCache(stateCacheKey);
        if (!state) {
            return null;
        }

        const authorityCacheKey = this.generateAuthorityKey(state);
        return this.getTemporaryCache(authorityCacheKey);
    }

    /**
     * Updates account, authority, and state in cache
     * @param serverAuthenticationRequest
     * @param account
     */
    updateCacheEntries(state: string, nonce: string, authorityInstance: string): void {
        // Cache the request state
        const stateCacheKey = this.generateStateKey(state);
        this.setTemporaryCache(stateCacheKey, state, false);

        // Cache the nonce
        const nonceCacheKey = this.generateNonceKey(state);
        this.setTemporaryCache(nonceCacheKey, nonce, false);

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
                this.removeItem(key);
            }
        });

        // delete generic interactive request parameters
        if (state) {
            this.removeItem(this.generateStateKey(state));
            this.removeItem(this.generateNonceKey(state));
            this.removeItem(this.generateAuthorityKey(state));
        }
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.URL_HASH));
    }

    cleanRequest(stateString?: string): void {
        // Interaction is completed - remove interaction status.
        this.removeItem(this.generateCacheKey(BrowserConstants.INTERACTION_STATUS_KEY));
        if (stateString) {
            const stateKey = this.generateStateKey(stateString);
            const cachedState = this.getItem(stateKey);
            this.resetRequestCache(cachedState || "");
        }
    }

    cacheCodeRequest(authCodeRequest: AuthorizationCodeRequest, browserCrypto: ICrypto): void {
        const encodedValue = browserCrypto.base64Encode(JSON.stringify(authCodeRequest));
        this.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, encodedValue, true);
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    getCachedRequest(state: string, browserCrypto: ICrypto): AuthorizationCodeRequest {
        try {
            // Get token request from cache and parse as TokenExchangeParameters.
            const encodedTokenRequest = this.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true);

            const parsedRequest = JSON.parse(browserCrypto.base64Decode(encodedTokenRequest)) as AuthorizationCodeRequest;
            this.removeItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));

            // Get cached authority and use if no authority is cached with request.
            if (StringUtils.isEmpty(parsedRequest.authority)) {
                const authorityCacheKey: string = this.generateAuthorityKey(state);
                const cachedAuthority: string = this.getTemporaryCache(authorityCacheKey);
                parsedRequest.authority = cachedAuthority;
            }
            return parsedRequest;
        } catch (err) {
            throw BrowserAuthError.createTokenRequestCacheError(err);
        }
    }
}
