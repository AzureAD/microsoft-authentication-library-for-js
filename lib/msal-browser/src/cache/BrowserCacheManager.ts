/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, PersistentCacheKeys, StringUtils, AuthorizationCodeRequest, ICrypto, AccountEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, AppMetadataEntity, CacheManager, ServerTelemetryEntity, ThrottlingEntity, ProtocolUtils, Logger, AuthorityMetadataEntity, DEFAULT_CRYPTO_IMPLEMENTATION } from "@azure/msal-common";
import { CacheOptions } from "../config/Configuration";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserCacheLocation, InteractionType, TemporaryCacheKeys } from "../utils/BrowserConstants";
import { BrowserStorage } from "./BrowserStorage";
import { MemoryStorage } from "./MemoryStorage";
import { IWindowStorage } from "./IWindowStorage";
import { BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";

/**
 * This class implements the cache storage interface for MSAL through browser local or session storage.
 * Cookies are only used if storeAuthStateInCookie is true, and are only used for
 * parameters such as state and nonce, generally.
 */
export class BrowserCacheManager extends CacheManager {

    // Cache configuration, either set by user or default values.
    private cacheConfig: Required<CacheOptions>;
    // Window storage object (either local or sessionStorage)
    private browserStorage: IWindowStorage;
    // Internal in-memory storage object used for data used by msal that does not need to persist across page loads
    private internalStorage: MemoryStorage;
    // Temporary cache 
    private temporaryCacheStorage: IWindowStorage;
    // Client id of application. Used in cache keys to partition cache correctly in the case of multiple instances of MSAL.
    private logger: Logger;

    // Cookie life calculation (hours * minutes * seconds * ms)
    private readonly COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;

    constructor(clientId: string, cacheConfig: Required<CacheOptions>, cryptoImpl: ICrypto, logger: Logger) {
        super(clientId, cryptoImpl);

        this.cacheConfig = cacheConfig;
        this.logger = logger;

        this.internalStorage = new MemoryStorage();
        this.browserStorage = this.setupBrowserStorage(this.cacheConfig.cacheLocation);
        this.temporaryCacheStorage = this.setupTemporaryCacheStorage(this.cacheConfig.cacheLocation);

        // Migrate any cache entries from older versions of MSAL.
        this.migrateCacheEntries();
    }

    /**
     * Returns a window storage class implementing the IWindowStorage interface that corresponds to the configured cacheLocation.
     * @param cacheLocation 
     */
    private setupBrowserStorage(cacheLocation: BrowserCacheLocation | string): IWindowStorage {
        switch (cacheLocation) {
            case BrowserCacheLocation.LocalStorage:
            case BrowserCacheLocation.SessionStorage:
                try {
                    // Temporary cache items will always be stored in session storage to mitigate problems caused by multiple tabs
                    return new BrowserStorage(cacheLocation);
                } catch (e) {
                    this.logger.verbose(e);
                    break;
                }
            case BrowserCacheLocation.MemoryStorage:
            default:
                break;
        }
        this.cacheConfig.cacheLocation = BrowserCacheLocation.MemoryStorage;
        return new MemoryStorage();
    }

    /**
     * 
     * @param cacheLocation 
     */
    private setupTemporaryCacheStorage(cacheLocation: BrowserCacheLocation | string): IWindowStorage {
        switch (cacheLocation) {
            case BrowserCacheLocation.LocalStorage:
            case BrowserCacheLocation.SessionStorage:
                try {
                    // Temporary cache items will always be stored in session storage to mitigate problems caused by multiple tabs
                    return new BrowserStorage(BrowserCacheLocation.SessionStorage);
                } catch (e) {
                    this.logger.verbose(e);
                    return this.internalStorage;
                }
            case BrowserCacheLocation.MemoryStorage:
            default:
                return this.internalStorage;
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

        const idTokenValue = this.browserStorage.getItem(idTokenKey);
        const clientInfoValue = this.browserStorage.getItem(clientInfoKey);
        const errorValue = this.browserStorage.getItem(errorKey);
        const errorDescValue = this.browserStorage.getItem(errorDescKey);

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
    private migrateCacheEntry(newKey: string, value: string|null): void {
        if (value) {
            this.setTemporaryCache(newKey, value, true);
        }
    }

    /**
     * Parses passed value as JSON object, JSON.parse() will throw an error.
     * @param input
     */
    private validateAndParseJson(jsonValue: string): object | null {
        try {
            const parsedJson = JSON.parse(jsonValue);
            /**
             * There are edge cases in which JSON.parse will successfully parse a non-valid JSON object 
             * (e.g. JSON.parse will parse an escaped string into an unescaped string), so adding a type check
             * of the parsed value is necessary in order to be certain that the string represents a valid JSON object.
             *
             */
            return (parsedJson && typeof parsedJson === "object") ? parsedJson : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * fetches the entry from the browser storage based off the key
     * @param key
     */
    getItem(key: string): string | null {
        return this.browserStorage.getItem(key);
    }

    /**
     * sets the entry in the browser storage
     * @param key
     * @param value
     */
    setItem(key: string, value: string): void {
        this.browserStorage.setItem(key, value);
    }

    /**
     * fetch the account entity from the platform cache
     * @param accountKey
     */
    getAccount(accountKey: string): AccountEntity | null {
        const account = this.getItem(accountKey);
        if (!account) {
            return null;
        }

        const parsedAccount = this.validateAndParseJson(account);
        if (!parsedAccount) {
            return null;
        }

        const accountEntity = CacheManager.toObject<AccountEntity>(new AccountEntity(), parsedAccount);
        if (AccountEntity.isAccountEntity(accountEntity)) {
            return accountEntity;
        }
        return null;
    }

    /**
     * set account entity in the platform cache
     * @param key
     * @param value
     */
    setAccount(account: AccountEntity): void {
        const key = account.generateAccountKey();
        this.setItem(key, JSON.stringify(account));
    }

    /**
     * generates idToken entity from a string
     * @param idTokenKey
     */
    getIdTokenCredential(idTokenKey: string): IdTokenEntity | null {
        const value = this.getItem(idTokenKey);
        if (!value) {
            return null;
        }

        const parsedIdToken = this.validateAndParseJson(value);
        if (!parsedIdToken) {
            return null;
        }

        const idToken: IdTokenEntity = CacheManager.toObject(new IdTokenEntity(), parsedIdToken);
        if (IdTokenEntity.isIdTokenEntity(idToken)) {
            return idToken;
        }
        return null;
    }

    /**
     * set IdToken credential to the platform cache
     * @param idToken
     */
    setIdTokenCredential(idToken: IdTokenEntity): void {
        const idTokenKey = idToken.generateCredentialKey();
        this.setItem(idTokenKey, JSON.stringify(idToken));
    }

    /**
     * generates accessToken entity from a string
     * @param key
     */
    getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null {
        const value = this.getItem(accessTokenKey);
        if (!value) {
            return null;
        }
        const parsedAccessToken = this.validateAndParseJson(value);
        if (!parsedAccessToken) {
            return null;
        }

        const accessToken: AccessTokenEntity = CacheManager.toObject(new AccessTokenEntity(), parsedAccessToken);
        if (AccessTokenEntity.isAccessTokenEntity(accessToken)) {
            return accessToken;
        }
        return null;
    }

    /**
     * set accessToken credential to the platform cache
     * @param accessToken
     */
    setAccessTokenCredential(accessToken: AccessTokenEntity): void {
        const accessTokenKey = accessToken.generateCredentialKey();
        this.setItem(accessTokenKey, JSON.stringify(accessToken));
    }

    /**
     * generates refreshToken entity from a string
     * @param refreshTokenKey
     */
    getRefreshTokenCredential(refreshTokenKey: string): RefreshTokenEntity | null {
        const value = this.getItem(refreshTokenKey);
        if (!value) {
            return null;
        }
        const parsedRefreshToken = this.validateAndParseJson(value);
        if (!parsedRefreshToken) {
            return null;
        }

        const refreshToken: RefreshTokenEntity = CacheManager.toObject(new RefreshTokenEntity(), parsedRefreshToken);
        if (RefreshTokenEntity.isRefreshTokenEntity(refreshToken)) {
            return refreshToken;
        }
        return null;
    }

    /**
     * set refreshToken credential to the platform cache
     * @param refreshToken
     */
    setRefreshTokenCredential(refreshToken: RefreshTokenEntity): void {
        const refreshTokenKey = refreshToken.generateCredentialKey();
        this.setItem(refreshTokenKey, JSON.stringify(refreshToken));
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    getAppMetadata(appMetadataKey: string): AppMetadataEntity | null {
        const value = this.getItem(appMetadataKey);
        if (!value) {
            return null;
        }

        const parsedMetadata = this.validateAndParseJson(value);
        if (!parsedMetadata) {
            return null;
        }

        const appMetadata: AppMetadataEntity = CacheManager.toObject(new AppMetadataEntity(), parsedMetadata);
        if (AppMetadataEntity.isAppMetadataEntity(appMetadataKey, appMetadata)) {
            return appMetadata;
        }
        return null;
    }

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata
     */
    setAppMetadata(appMetadata: AppMetadataEntity): void {
        const appMetadataKey = appMetadata.generateAppMetadataKey();
        this.setItem(appMetadataKey, JSON.stringify(appMetadata));
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetryKey
     */
    getServerTelemetry(serverTelemetryKey: string): ServerTelemetryEntity | null {
        const value = this.getItem(serverTelemetryKey);
        if (!value) {
            return null;
        }
        const parsedMetadata = this.validateAndParseJson(value);
        if (!parsedMetadata) {
            return null;
        }

        const serverTelemetryEntity = CacheManager.toObject(new ServerTelemetryEntity(), parsedMetadata);
        if (ServerTelemetryEntity.isServerTelemetryEntity(serverTelemetryKey, serverTelemetryEntity)) {
            return serverTelemetryEntity;
        }
        return null;
    }

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    setServerTelemetry(serverTelemetryKey: string, serverTelemetry: ServerTelemetryEntity): void {
        this.setItem(serverTelemetryKey, JSON.stringify(serverTelemetry));
    }

    /**
     * 
     */
    getAuthorityMetadata(key: string) : AuthorityMetadataEntity | null {
        const value = this.internalStorage.getItem(key);
        if (!value) {
            return null;
        }
        const parsedMetadata = this.validateAndParseJson(value);
        if (parsedMetadata && AuthorityMetadataEntity.isAuthorityMetadataEntity(key, parsedMetadata)) {
            return CacheManager.toObject(new AuthorityMetadataEntity(), parsedMetadata);
        }
        return null;
    }

    /**
     * 
     */
    getAuthorityMetadataKeys(): Array<string> {
        const allKeys = this.internalStorage.getKeys();
        return allKeys.filter((key) => {
            return this.isAuthorityMetadata(key);
        });
    }

    /**
     * 
     * @param entity 
     */
    setAuthorityMetadata(key: string, entity: AuthorityMetadataEntity): void {
        this.internalStorage.setItem(key, JSON.stringify(entity));
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const value = this.getItem(throttlingCacheKey);
        if (!value) {
            return null;
        }
        
        const parsedThrottlingCache = this.validateAndParseJson(value);
        if (!parsedThrottlingCache) {
            return null;
        }

        const throttlingCache = CacheManager.toObject(new ThrottlingEntity(), parsedThrottlingCache);
        if (ThrottlingEntity.isThrottlingEntity(throttlingCacheKey, throttlingCache)) {
            return throttlingCache;
        }
        return null;
    }

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    setThrottlingCache(throttlingCacheKey: string, throttlingCache: ThrottlingEntity): void {
        this.setItem(throttlingCacheKey, JSON.stringify(throttlingCache));
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    getTemporaryCache(cacheKey: string, generateKey?: boolean): string | null {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
        if (this.cacheConfig.storeAuthStateInCookie) {
            const itemCookie = this.getItemCookie(key);
            if (itemCookie) {
                return itemCookie;
            }
        }

        const value = this.temporaryCacheStorage.getItem(key);
        if (!value) {
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

        this.temporaryCacheStorage.setItem(key, value);
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
        this.browserStorage.removeItem(key);
        this.temporaryCacheStorage.removeItem(key);
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
        return this.browserStorage.containsKey(key) || this.temporaryCacheStorage.containsKey(key);
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        return [
            ...this.browserStorage.getKeys(),
            ...this.temporaryCacheStorage.getKeys()
        ];
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(): void {
        this.removeAllAccounts();
        this.removeAppMetadata();
        this.getKeys().forEach((cacheKey: string) => {
            // Check if key contains msal prefix; For now, we are clearing all the cache items created by MSAL.js
            if ((this.browserStorage.containsKey(cacheKey) || this.temporaryCacheStorage.containsKey(cacheKey)) && ((cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1) || (cacheKey.indexOf(this.clientId) !== -1))) {
                this.removeItem(cacheKey);
            }
        });

        this.internalStorage.clear();
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
     * Get cookie expiration time
     * @param cookieLifeDays
     */
    getCookieExpirationTime(cookieLifeDays: number): string {
        const today = new Date();
        const expr = new Date(today.getTime() + cookieLifeDays * this.COOKIE_LIFE_MULTIPLIER);
        return expr.toUTCString();
    }

    /**
     * Gets the cache object referenced by the browser
     */
    getCache(): object {
        return this.browserStorage;
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
        const generatedKey = this.validateAndParseJson(key);
        if (!generatedKey) {
            if (StringUtils.startsWith(key, Constants.CACHE_PREFIX) || StringUtils.startsWith(key, PersistentCacheKeys.ADAL_ID_TOKEN)) {
                return key;
            }
            return `${Constants.CACHE_PREFIX}.${this.clientId}.${key}`;
        }

        return JSON.stringify(key);
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
     * Gets the cached authority based on the cached state. Returns empty if no cached state found.
     */
    getCachedAuthority(cachedState: string): string | null {
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
        const authorityCacheKey = this.generateAuthorityKey(state);
        this.setTemporaryCache(authorityCacheKey, authorityInstance, false);
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
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.INTERACTION_STATUS_KEY));
    }

    /**
     * Removes temporary cache for the provided state
     * @param stateString 
     */
    cleanRequestByState(stateString: string): void {
        // Interaction is completed - remove interaction status.
        if (stateString) {
            const stateKey = this.generateStateKey(stateString);
            const cachedState = this.temporaryCacheStorage.getItem(stateKey);
            this.logger.info(`BrowserCacheManager.cleanRequestByState: Removing temporary cache items for state: ${cachedState}`);
            this.resetRequestCache(cachedState || "");
        }
    }

    /**
     * Looks in temporary cache for any state values with the provided interactionType and removes all temporary cache items for that state
     * Used in scenarios where temp cache needs to be cleaned but state is not known, such as clicking browser back button.
     * @param interactionType 
     */
    cleanRequestByInteractionType(interactionType: InteractionType): void {
        this.getKeys().forEach((key) => {
            if (key.indexOf(TemporaryCacheKeys.REQUEST_STATE) === -1) {
                return;
            }

            const value = this.temporaryCacheStorage.getItem(key);
            if (!value) {
                return;
            }
            const parsedState = BrowserProtocolUtils.extractBrowserRequestState(this.cryptoImpl, value);
            if (parsedState && parsedState.interactionType === interactionType) {
                this.logger.info(`BrowserCacheManager.cleanRequestByInteractionType: Removing temporary cache items for state: ${value}`);
                this.resetRequestCache(value);
            }
        });
    }

    cacheCodeRequest(authCodeRequest: AuthorizationCodeRequest, browserCrypto: ICrypto): void {
        const encodedValue = browserCrypto.base64Encode(JSON.stringify(authCodeRequest));
        this.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, encodedValue, true);
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    getCachedRequest(state: string, browserCrypto: ICrypto): AuthorizationCodeRequest {
        // Get token request from cache and parse as TokenExchangeParameters.
        const encodedTokenRequest = this.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true);
        if (!encodedTokenRequest) {
            throw BrowserAuthError.createNoTokenRequestCacheError();
        }

        const parsedRequest = this.validateAndParseJson(browserCrypto.base64Decode(encodedTokenRequest)) as AuthorizationCodeRequest;
        if (!parsedRequest) {
            throw BrowserAuthError.createUnableToParseTokenRequestCacheError();
        }
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));

        // Get cached authority and use if no authority is cached with request.
        if (StringUtils.isEmpty(parsedRequest.authority)) {
            const authorityCacheKey: string = this.generateAuthorityKey(state);
            const cachedAuthority = this.getTemporaryCache(authorityCacheKey);
            if (!cachedAuthority) {
                throw BrowserAuthError.createNoCachedAuthorityError();
            }
            parsedRequest.authority = cachedAuthority;
        }
        
        return parsedRequest;
    }
}

export const DEFAULT_BROWSER_CACHE_MANAGER = (clientId: string, logger: Logger) => {
    const cacheOptions = {
        cacheLocation: BrowserCacheLocation.MemoryStorage,
        storeAuthStateInCookie: false
    };
    return new BrowserCacheManager(clientId, cacheOptions, DEFAULT_CRYPTO_IMPLEMENTATION, logger);
};
