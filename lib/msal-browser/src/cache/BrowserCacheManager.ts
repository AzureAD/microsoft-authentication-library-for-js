/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants, PersistentCacheKeys, StringUtils, CommonAuthorizationCodeRequest, ICrypto, AccountEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, AppMetadataEntity, CacheManager, ServerTelemetryEntity, ThrottlingEntity, ProtocolUtils, Logger, AuthorityMetadataEntity, DEFAULT_CRYPTO_IMPLEMENTATION, AccountInfo, ActiveAccountFilters, CcsCredential, CcsCredentialType, IdToken, ValidCredentialType, ClientAuthError } from "@azure/msal-common";
import { CacheOptions } from "../config/Configuration";
import { BrowserAuthError } from "../error/BrowserAuthError";
import { BrowserCacheLocation, InteractionType, TemporaryCacheKeys, InMemoryCacheKeys } from "../utils/BrowserConstants";
import { BrowserStorage } from "./BrowserStorage";
import { MemoryStorage } from "./MemoryStorage";
import { IWindowStorage } from "./IWindowStorage";
import { BrowserProtocolUtils } from "../utils/BrowserProtocolUtils";
import { NativeTokenRequest } from "../broker/nativeBroker/NativeRequest";

/**
 * This class implements the cache storage interface for MSAL through browser local or session storage.
 * Cookies are only used if storeAuthStateInCookie is true, and are only used for
 * parameters such as state and nonce, generally.
 */
export class BrowserCacheManager extends CacheManager {

    // Cache configuration, either set by user or default values.
    protected cacheConfig: Required<CacheOptions>;
    // Window storage object (either local or sessionStorage)
    protected browserStorage: IWindowStorage<string>;
    // Internal in-memory storage object used for data used by msal that does not need to persist across page loads
    protected internalStorage: MemoryStorage<string>;
    // Temporary cache
    protected temporaryCacheStorage: IWindowStorage<string>;
    // Client id of application. Used in cache keys to partition cache correctly in the case of multiple instances of MSAL.
    protected logger: Logger;

    // Cookie life calculation (hours * minutes * seconds * ms)
    protected readonly COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;

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
    protected setupBrowserStorage(cacheLocation: BrowserCacheLocation | string): IWindowStorage<string> {
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
    protected setupTemporaryCacheStorage(cacheLocation: BrowserCacheLocation | string): IWindowStorage<string> {
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
    protected migrateCacheEntries(): void {
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

        keysToMigrate.forEach((cacheKey:string, index: number) => this.migrateCacheEntry(cacheKey, values[index]));
    }

    /**
     * Utility function to help with migration.
     * @param newKey
     * @param value
     * @param storeAuthStateInCookie
     */
    protected migrateCacheEntry(newKey: string, value: string|null): void {
        if (value) {
            this.setTemporaryCache(newKey, value, true);
        }
    }

    /**
     * Parses passed value as JSON object, JSON.parse() will throw an error.
     * @param input
     */
    protected validateAndParseJson(jsonValue: string): object | null {
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
        if (!parsedAccount || !AccountEntity.isAccountEntity(parsedAccount)) {
            return null;
        }

        return CacheManager.toObject<AccountEntity>(new AccountEntity(), parsedAccount);
    }

    /**
     * set account entity in the platform cache
     * @param key
     * @param value
     */
    setAccount(account: AccountEntity): void {
        this.logger.trace("BrowserCacheManager.setAccount called");
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
            this.logger.trace("BrowserCacheManager.getIdTokenCredential: called, no cache hit");
            return null;
        }

        const parsedIdToken = this.validateAndParseJson(value);
        if (!parsedIdToken || !IdTokenEntity.isIdTokenEntity(parsedIdToken)) {
            this.logger.trace("BrowserCacheManager.getIdTokenCredential: called, no cache hit");
            return null;
        }

        this.logger.trace("BrowserCacheManager.getIdTokenCredential: cache hit");
        return CacheManager.toObject(new IdTokenEntity(), parsedIdToken);
    }

    /**
     * set IdToken credential to the platform cache
     * @param idToken
     */
    setIdTokenCredential(idToken: IdTokenEntity): void {
        this.logger.trace("BrowserCacheManager.setIdTokenCredential called");
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
            this.logger.trace("BrowserCacheManager.getAccessTokenCredential: called, no cache hit");
            return null;
        }
        const parsedAccessToken = this.validateAndParseJson(value);
        if (!parsedAccessToken || !AccessTokenEntity.isAccessTokenEntity(parsedAccessToken)) {
            this.logger.trace("BrowserCacheManager.getAccessTokenCredential: called, no cache hit");
            return null;
        }

        this.logger.trace("BrowserCacheManager.getAccessTokenCredential: cache hit");
        return CacheManager.toObject(new AccessTokenEntity(), parsedAccessToken);
    }

    /**
     * set accessToken credential to the platform cache
     * @param accessToken
     */
    setAccessTokenCredential(accessToken: AccessTokenEntity): void {
        this.logger.trace("BrowserCacheManager.setAccessTokenCredential called");
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
            this.logger.trace("BrowserCacheManager.getRefreshTokenCredential: called, no cache hit");
            return null;
        }
        const parsedRefreshToken = this.validateAndParseJson(value);
        if (!parsedRefreshToken || !RefreshTokenEntity.isRefreshTokenEntity(parsedRefreshToken)) {
            this.logger.trace("BrowserCacheManager.getRefreshTokenCredential: called, no cache hit");
            return null;
        }

        this.logger.trace("BrowserCacheManager.getRefreshTokenCredential: cache hit");
        return CacheManager.toObject(new RefreshTokenEntity(), parsedRefreshToken);
    }

    /**
     * set refreshToken credential to the platform cache
     * @param refreshToken
     */
    setRefreshTokenCredential(refreshToken: RefreshTokenEntity): void {
        this.logger.trace("BrowserCacheManager.setRefreshTokenCredential called");
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
            this.logger.trace("BrowserCacheManager.getAppMetadata: called, no cache hit");
            return null;
        }

        const parsedMetadata = this.validateAndParseJson(value);
        if (!parsedMetadata || !AppMetadataEntity.isAppMetadataEntity(appMetadataKey, parsedMetadata)) {
            this.logger.trace("BrowserCacheManager.getAppMetadata: called, no cache hit");
            return null;
        }

        this.logger.trace("BrowserCacheManager.getAppMetadata: cache hit");
        return CacheManager.toObject(new AppMetadataEntity(), parsedMetadata);
    }

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata
     */
    setAppMetadata(appMetadata: AppMetadataEntity): void {
        this.logger.trace("BrowserCacheManager.setAppMetadata called");
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
            this.logger.trace("BrowserCacheManager.getServerTelemetry: called, no cache hit");
            return null;
        }
        const parsedMetadata = this.validateAndParseJson(value);
        if (!parsedMetadata || !ServerTelemetryEntity.isServerTelemetryEntity(serverTelemetryKey, parsedMetadata)) {
            this.logger.trace("BrowserCacheManager.getServerTelemetry: called, no cache hit");
            return null;
        }

        this.logger.trace("BrowserCacheManager.getServerTelemetry: cache hit");
        return CacheManager.toObject(new ServerTelemetryEntity(), parsedMetadata);
    }

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    setServerTelemetry(serverTelemetryKey: string, serverTelemetry: ServerTelemetryEntity): void {
        this.logger.trace("BrowserCacheManager.setServerTelemetry called");
        this.setItem(serverTelemetryKey, JSON.stringify(serverTelemetry));
    }

    /**
     *
     */
    getAuthorityMetadata(key: string) : AuthorityMetadataEntity | null {
        const value = this.internalStorage.getItem(key);
        if (!value) {
            this.logger.trace("BrowserCacheManager.getAuthorityMetadata: called, no cache hit");
            return null;
        }
        const parsedMetadata = this.validateAndParseJson(value);
        if (parsedMetadata && AuthorityMetadataEntity.isAuthorityMetadataEntity(key, parsedMetadata)) {
            this.logger.trace("BrowserCacheManager.getAuthorityMetadata: cache hit");
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
     * Sets wrapper metadata in memory
     * @param wrapperSKU
     * @param wrapperVersion
     */
    setWrapperMetadata(wrapperSKU: string, wrapperVersion: string): void {
        this.internalStorage.setItem(InMemoryCacheKeys.WRAPPER_SKU, wrapperSKU);
        this.internalStorage.setItem(InMemoryCacheKeys.WRAPPER_VER, wrapperVersion);
    }

    /**
     * Returns wrapper metadata from in-memory storage
     */
    getWrapperMetadata(): [string, string] {
        const sku = this.internalStorage.getItem(InMemoryCacheKeys.WRAPPER_SKU) || Constants.EMPTY_STRING;
        const version = this.internalStorage.getItem(InMemoryCacheKeys.WRAPPER_VER) || Constants.EMPTY_STRING;
        return [sku, version];
    }

    /**
     *
     * @param entity
     */
    setAuthorityMetadata(key: string, entity: AuthorityMetadataEntity): void {
        this.logger.trace("BrowserCacheManager.setAuthorityMetadata called");
        this.internalStorage.setItem(key, JSON.stringify(entity));
    }

    /**
     * Gets the active account
     */
    getActiveAccount(): AccountInfo | null {
        const activeAccountKeyFilters = this.generateCacheKey(PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS);
        const activeAccountValueFilters = this.getItem(activeAccountKeyFilters);
        if (!activeAccountValueFilters) { 
            // if new active account cache type isn't found, it's an old version, so look for that instead
            this.logger.trace("No active account filters cache schema found, looking for legacy schema");
            const activeAccountKeyLocal = this.generateCacheKey(PersistentCacheKeys.ACTIVE_ACCOUNT);
            const activeAccountValueLocal = this.getItem(activeAccountKeyLocal);
            if(!activeAccountValueLocal) {
                this.logger.trace("No active account found");
                return null;
            }
            const activeAccount = this.getAccountInfoByFilter({localAccountId: activeAccountValueLocal})[0] || null;
            if(activeAccount) {
                this.logger.trace("Legacy active account cache schema found");
                this.logger.trace("Adding active account filters cache schema");
                this.setActiveAccount(activeAccount);
                return activeAccount;
            }
            return null;
        }
        const activeAccountValueObj = this.validateAndParseJson(activeAccountValueFilters) as AccountInfo;
        if(activeAccountValueObj) {
            this.logger.trace("Active account filters schema found");
            return this.getAccountInfoByFilter({
                homeAccountId: activeAccountValueObj.homeAccountId,
                localAccountId: activeAccountValueObj.localAccountId
            })[0] || null;
        }
        this.logger.trace("No active account found");
        return null;
    }

    /**
     * Sets the active account's localAccountId in cache
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        const activeAccountKey = this.generateCacheKey(PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS);
        const activeAccountKeyLocal = this.generateCacheKey(PersistentCacheKeys.ACTIVE_ACCOUNT);
        if (account) {
            this.logger.verbose("setActiveAccount: Active account set");
            const activeAccountValue: ActiveAccountFilters = {
                homeAccountId: account.homeAccountId,
                localAccountId: account.localAccountId
            };
            this.browserStorage.setItem(activeAccountKey, JSON.stringify(activeAccountValue));
            this.browserStorage.setItem(activeAccountKeyLocal, account.localAccountId);
        } else {
            this.logger.verbose("setActiveAccount: No account passed, active account not set");
            this.browserStorage.removeItem(activeAccountKey);
            this.browserStorage.removeItem(activeAccountKeyLocal);
        }
    }

    /**
     * Gets a list of accounts that match all of the filters provided
     * @param account
     */
    getAccountInfoByFilter(accountFilter: Partial<Omit<AccountInfo, "idTokenClaims"|"name">>): AccountInfo[] {
        const allAccounts = this.getAllAccounts();
        return allAccounts.filter((accountObj) => {
            if (accountFilter.username && accountFilter.username.toLowerCase() !== accountObj.username.toLowerCase()) {
                return false;
            }

            if (accountFilter.homeAccountId && accountFilter.homeAccountId !== accountObj.homeAccountId) {
                return false;
            }

            if (accountFilter.localAccountId && accountFilter.localAccountId !== accountObj.localAccountId) {
                return false;
            }

            if (accountFilter.tenantId && accountFilter.tenantId !== accountObj.tenantId) {
                return false;
            }

            if (accountFilter.environment && accountFilter.environment !== accountObj.environment) {
                return false;
            }

            return true;
        });
    }

    /**
     * Checks the cache for accounts matching loginHint or SID
     * @param loginHint
     * @param sid
     */
    getAccountInfoByHints(loginHint?: string, sid?: string): AccountInfo | null {
        const matchingAccounts = this.getAllAccounts().filter((accountInfo) => {
            if (sid) {
                const accountSid = accountInfo.idTokenClaims && accountInfo.idTokenClaims["sid"];
                return sid === accountSid;
            }

            if (loginHint) {
                return loginHint === accountInfo.username;
            }

            return false;
        });

        if (matchingAccounts.length === 1) {
            return matchingAccounts[0];
        } else if (matchingAccounts.length > 1) {
            throw ClientAuthError.createMultipleMatchingAccountsInCacheError();
        }

        return null;
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const value = this.getItem(throttlingCacheKey);
        if (!value) {
            this.logger.trace("BrowserCacheManager.getThrottlingCache: called, no cache hit");
            return null;
        }

        const parsedThrottlingCache = this.validateAndParseJson(value);
        if (!parsedThrottlingCache || !ThrottlingEntity.isThrottlingEntity(throttlingCacheKey, parsedThrottlingCache)) {
            this.logger.trace("BrowserCacheManager.getThrottlingCache: called, no cache hit");
            return null;
        }

        this.logger.trace("BrowserCacheManager.getThrottlingCache: cache hit");
        return CacheManager.toObject(new ThrottlingEntity(), parsedThrottlingCache);
    }

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    setThrottlingCache(throttlingCacheKey: string, throttlingCache: ThrottlingEntity): void {
        this.logger.trace("BrowserCacheManager.setThrottlingCache called");
        this.setItem(throttlingCacheKey, JSON.stringify(throttlingCache));
    }

    /**
     * Gets cache item with given key.
     * Will retrieve from cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    getTemporaryCache(cacheKey: string, generateKey?: boolean): string | null {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
        if (this.cacheConfig.storeAuthStateInCookie) {
            const itemCookie = this.getItemCookie(key);
            if (itemCookie) {
                this.logger.trace("BrowserCacheManager.getTemporaryCache: storeAuthStateInCookies set to true, retrieving from cookies");
                return itemCookie;
            }
        }

        const value = this.temporaryCacheStorage.getItem(key);
        if (!value) {
            // If temp cache item not found in session/memory, check local storage for items set by old versions
            if (this.cacheConfig.cacheLocation === BrowserCacheLocation.LocalStorage) {
                const item = this.browserStorage.getItem(key);
                if (item) {
                    this.logger.trace("BrowserCacheManager.getTemporaryCache: Temporary cache item found in local storage");
                    return item;
                }
            }
            this.logger.trace("BrowserCacheManager.getTemporaryCache: No cache item found in local storage");
            return null;
        }
        this.logger.trace("BrowserCacheManager.getTemporaryCache: Temporary cache item returned");
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
            this.logger.trace("BrowserCacheManager.setTemporaryCache: storeAuthStateInCookie set to true, setting item cookie");
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
            this.logger.trace("BrowserCacheManager.removeItem: storeAuthStateInCookie is true, clearing item cookie");
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
     * Clears all cache entries created by MSAL.
     */
    async clear(): Promise<void> {
        // Removes all accounts and their credentials
        await this.removeAllAccounts();
        this.removeAppMetadata();

        // Removes all remaining MSAL cache items
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
        let cookieStr = `${encodeURIComponent(cookieName)}=${encodeURIComponent(cookieValue)};path=/;SameSite=Lax;`;
        if (expires) {
            const expireTime = this.getCookieExpirationTime(expires);
            cookieStr += `expires=${expireTime};`;
        }

        if (this.cacheConfig.secureCookies) {
            cookieStr += "Secure;";
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
        for (let i: number = 0; i < cookieList.length; i++) {
            let cookie = cookieList[i];
            while (cookie.charAt(0) === " ") {
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(name) === 0) {
                return decodeURIComponent(cookie.substring(name.length, cookie.length));
            }
        }
        return Constants.EMPTY_STRING;
    }

    /**
     * Clear all msal-related cookies currently set in the browser. Should only be used to clear temporary cache items.
     */
    clearMsalCookies(): void {
        const cookiePrefix = `${Constants.CACHE_PREFIX}.${this.clientId}`;
        const cookieList = document.cookie.split(";");
        cookieList.forEach((cookie: string): void => {
            while (cookie.charAt(0) === " ") {
                // eslint-disable-next-line no-param-reassign
                cookie = cookie.substring(1);
            }
            if (cookie.indexOf(cookiePrefix) === 0) {
                const cookieKey = cookie.split("=")[0];
                this.clearItemCookie(cookieKey);
            }
        });
    }

    /**
     * Clear an item in the cookies by key
     * @param cookieName
     */
    clearItemCookie(cookieName: string): void {
        this.setItemCookie(cookieName, Constants.EMPTY_STRING, -1);
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
    updateCacheEntries(state: string, nonce: string, authorityInstance: string, loginHint: string, account: AccountInfo|null): void {
        this.logger.trace("BrowserCacheManager.updateCacheEntries called");
        // Cache the request state
        const stateCacheKey = this.generateStateKey(state);
        this.setTemporaryCache(stateCacheKey, state, false);

        // Cache the nonce
        const nonceCacheKey = this.generateNonceKey(state);
        this.setTemporaryCache(nonceCacheKey, nonce, false);

        // Cache authorityKey
        const authorityCacheKey = this.generateAuthorityKey(state);
        this.setTemporaryCache(authorityCacheKey, authorityInstance, false);

        if (account) {
            const ccsCredential: CcsCredential = {
                credential: account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID
            };
            this.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(ccsCredential), true);
        } else if (!StringUtils.isEmpty(loginHint)) {
            const ccsCredential: CcsCredential = {
                credential: loginHint,
                type: CcsCredentialType.UPN
            };
            this.setTemporaryCache(TemporaryCacheKeys.CCS_CREDENTIAL, JSON.stringify(ccsCredential), true);
        }
    }

    /**
     * Reset all temporary cache items
     * @param state
     */
    resetRequestCache(state: string): void {
        this.logger.trace("BrowserCacheManager.resetRequestCache called");
        // check state and remove associated cache items
        if (!StringUtils.isEmpty(state)) {
            this.getKeys().forEach(key => {
                if (key.indexOf(state) !== -1) {
                    this.removeItem(key);
                }
            });
        }

        // delete generic interactive request parameters
        if (state) {
            this.removeItem(this.generateStateKey(state));
            this.removeItem(this.generateNonceKey(state));
            this.removeItem(this.generateAuthorityKey(state));
        }
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.URL_HASH));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.CORRELATION_ID));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.CCS_CREDENTIAL));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST));
        this.setInteractionInProgress(false);
    }

    /**
     * Removes temporary cache for the provided state
     * @param stateString
     */
    cleanRequestByState(stateString: string): void {
        this.logger.trace("BrowserCacheManager.cleanRequestByState called");
        // Interaction is completed - remove interaction status.
        if (stateString) {
            const stateKey = this.generateStateKey(stateString);
            const cachedState = this.temporaryCacheStorage.getItem(stateKey);
            this.logger.infoPii(`BrowserCacheManager.cleanRequestByState: Removing temporary cache items for state: ${cachedState}`);
            this.resetRequestCache(cachedState || Constants.EMPTY_STRING);
        }
        this.clearMsalCookies();
    }

    /**
     * Looks in temporary cache for any state values with the provided interactionType and removes all temporary cache items for that state
     * Used in scenarios where temp cache needs to be cleaned but state is not known, such as clicking browser back button.
     * @param interactionType
     */
    cleanRequestByInteractionType(interactionType: InteractionType): void {
        this.logger.trace("BrowserCacheManager.cleanRequestByInteractionType called");
        // Loop through all keys to find state key
        this.getKeys().forEach((key) => {
            // If this key is not the state key, move on
            if (key.indexOf(TemporaryCacheKeys.REQUEST_STATE) === -1) {
                return;
            }

            // Retrieve state value, return if not a valid value
            const stateValue = this.temporaryCacheStorage.getItem(key);
            if (!stateValue) {
                return;
            }
            // Extract state and ensure it matches given InteractionType, then clean request cache
            const parsedState = BrowserProtocolUtils.extractBrowserRequestState(this.cryptoImpl, stateValue);
            if (parsedState && parsedState.interactionType === interactionType) {
                this.logger.infoPii(`BrowserCacheManager.cleanRequestByInteractionType: Removing temporary cache items for state: ${stateValue}`);
                this.resetRequestCache(stateValue);
            }
        });
        this.clearMsalCookies();
        this.setInteractionInProgress(false);
    }

    cacheCodeRequest(authCodeRequest: CommonAuthorizationCodeRequest, browserCrypto: ICrypto): void {
        this.logger.trace("BrowserCacheManager.cacheCodeRequest called");

        const encodedValue = browserCrypto.base64Encode(JSON.stringify(authCodeRequest));
        this.setTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, encodedValue, true);
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    getCachedRequest(state: string, browserCrypto: ICrypto): CommonAuthorizationCodeRequest {
        this.logger.trace("BrowserCacheManager.getCachedRequest called");
        // Get token request from cache and parse as TokenExchangeParameters.
        const encodedTokenRequest = this.getTemporaryCache(TemporaryCacheKeys.REQUEST_PARAMS, true);
        if (!encodedTokenRequest) {
            throw BrowserAuthError.createNoTokenRequestCacheError();
        }

        const parsedRequest = this.validateAndParseJson(browserCrypto.base64Decode(encodedTokenRequest)) as CommonAuthorizationCodeRequest;
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

    /**
     * Gets cached native request for redirect flows
     */
    getCachedNativeRequest(): NativeTokenRequest | null {
        this.logger.trace("BrowserCacheManager.getCachedNativeRequest called");
        const cachedRequest = this.getTemporaryCache(TemporaryCacheKeys.NATIVE_REQUEST, true);
        if (!cachedRequest) {
            this.logger.trace("BrowserCacheManager.getCachedNativeRequest: No cached native request found");
            return null;
        }

        const parsedRequest = this.validateAndParseJson(cachedRequest) as NativeTokenRequest;
        if (!parsedRequest) {
            this.logger.error("BrowserCacheManager.getCachedNativeRequest: Unable to parse native request");
            return null;
        }

        return parsedRequest;
    }

    isInteractionInProgress(matchClientId?: boolean): boolean {
        const clientId = this.getInteractionInProgress();

        if (matchClientId) {
            return clientId === this.clientId;
        } else {
            return !!clientId;
        }
    }

    getInteractionInProgress(): string | null {
        const key = `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        return this.getTemporaryCache(key, false);
    }

    setInteractionInProgress(inProgress: boolean): void {
        // Ensure we don't overwrite interaction in progress for a different clientId
        const key = `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        if (inProgress) {
            if (this.getInteractionInProgress()) {
                throw BrowserAuthError.createInteractionInProgressError();
            } else {
                // No interaction is in progress
                this.setTemporaryCache(key, this.clientId, false);
            }
        } else if (!inProgress && this.getInteractionInProgress() === this.clientId) {
            this.removeItem(key);
        }
    }

    /**
     * Returns username retrieved from ADAL or MSAL v1 idToken
     */
    getLegacyLoginHint(): string | null {
        // Only check for adal/msal token if no SSO params are being used
        const adalIdTokenString = this.getTemporaryCache(PersistentCacheKeys.ADAL_ID_TOKEN);
        if (adalIdTokenString) {
            this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
            this.logger.verbose("Cached ADAL id token retrieved.");
        }

        // Check for cached MSAL v1 id token
        const msalIdTokenString = this.getTemporaryCache(PersistentCacheKeys.ID_TOKEN, true);
        if (msalIdTokenString) {
            this.removeItem(this.generateCacheKey(PersistentCacheKeys.ID_TOKEN));
            this.logger.verbose("Cached MSAL.js v1 id token retrieved");
        }

        const cachedIdTokenString = msalIdTokenString || adalIdTokenString;
        if (cachedIdTokenString) {
            const cachedIdToken = new IdToken(cachedIdTokenString, this.cryptoImpl);
            if (cachedIdToken.claims && cachedIdToken.claims.preferred_username) {
                this.logger.verbose("No SSO params used and ADAL/MSAL v1 token retrieved, setting ADAL/MSAL v1 preferred_username as loginHint");
                return cachedIdToken.claims.preferred_username;
            }
            else if (cachedIdToken.claims && cachedIdToken.claims.upn) {
                this.logger.verbose("No SSO params used and ADAL/MSAL v1 token retrieved, setting ADAL/MSAL v1 upn as loginHint");
                return cachedIdToken.claims.upn;
            }
            else {
                this.logger.verbose("No SSO params used and ADAL/MSAL v1 token retrieved, however, no account hint claim found. Enable preferred_username or upn id token claim to get SSO.");
            }
        }

        return null;
    }

    /**
     * Updates a credential's cache key if the current cache key is outdated
     */
    updateCredentialCacheKey(currentCacheKey: string, credential: ValidCredentialType): string {
        const updatedCacheKey = credential.generateCredentialKey();

        if (currentCacheKey !== updatedCacheKey) {
            const cacheItem = this.getItem(currentCacheKey);
            if (cacheItem) {
                this.removeItem(currentCacheKey);
                this.setItem(updatedCacheKey, cacheItem);
                this.logger.verbose(`Updated an outdated ${credential.credentialType} cache key`);
                return updatedCacheKey;
            } else {
                this.logger.error(`Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`);
            }
        }

        return currentCacheKey;
    }
}

export const DEFAULT_BROWSER_CACHE_MANAGER = (clientId: string, logger: Logger): BrowserCacheManager => {
    const cacheOptions = {
        cacheLocation: BrowserCacheLocation.MemoryStorage,
        storeAuthStateInCookie: false,
        secureCookies: false
    };
    return new BrowserCacheManager(clientId, cacheOptions, DEFAULT_CRYPTO_IMPLEMENTATION, logger);
};
