/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AccountEntity,
    AccountInfo,
    ActiveAccountFilters,
    AppMetadataEntity,
    AuthenticationScheme,
    AuthorityMetadataEntity,
    CacheError,
    CacheHelpers,
    CacheManager,
    CacheRecord,
    ClientAuthErrorCodes,
    CommonAuthorizationUrlRequest,
    Constants,
    createClientAuthError,
    CredentialType,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    ICrypto,
    IdTokenEntity,
    invokeAsync,
    IPerformanceClient,
    Logger,
    PerformanceEvents,
    PersistentCacheKeys,
    RefreshTokenEntity,
    ServerTelemetryEntity,
    StaticAuthorityOptions,
    StoreInCache,
    StringUtils,
    ThrottlingEntity,
    TimeUtils,
    TokenKeys,
} from "@azure/msal-common/browser";
import { CacheOptions } from "../config/Configuration.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import {
    BrowserCacheLocation,
    InMemoryCacheKeys,
    INTERACTION_TYPE,
    StaticCacheKeys,
    TemporaryCacheKeys,
} from "../utils/BrowserConstants.js";
import { LocalStorage } from "./LocalStorage.js";
import { SessionStorage } from "./SessionStorage.js";
import { MemoryStorage } from "./MemoryStorage.js";
import { IWindowStorage } from "./IWindowStorage.js";
import { NativeTokenRequest } from "../broker/nativeBroker/NativeRequest.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { base64Decode } from "../encode/Base64Decode.js";
import { base64Encode } from "../encode/Base64Encode.js";
import { CookieStorage } from "./CookieStorage.js";
import { getAccountKeys, getTokenKeys } from "./CacheHelpers.js";
import { EventType } from "../event/EventType.js";
import { EventHandler } from "../event/EventHandler.js";
import { clearHash } from "../utils/BrowserUtils.js";

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
    // Cookie storage
    protected cookieStorage: CookieStorage;
    // Logger instance
    protected logger: Logger;
    // Telemetry perf client
    protected performanceClient: IPerformanceClient;
    // Event Handler
    private eventHandler: EventHandler;

    constructor(
        clientId: string,
        cacheConfig: Required<CacheOptions>,
        cryptoImpl: ICrypto,
        logger: Logger,
        performanceClient: IPerformanceClient,
        eventHandler: EventHandler,
        staticAuthorityOptions?: StaticAuthorityOptions
    ) {
        super(clientId, cryptoImpl, logger, staticAuthorityOptions);
        this.cacheConfig = cacheConfig;
        this.logger = logger;
        this.internalStorage = new MemoryStorage();
        this.browserStorage = getStorageImplementation(
            clientId,
            cacheConfig.cacheLocation,
            logger,
            performanceClient
        );
        this.temporaryCacheStorage = getStorageImplementation(
            clientId,
            cacheConfig.temporaryCacheLocation,
            logger,
            performanceClient
        );
        this.cookieStorage = new CookieStorage();

        this.performanceClient = performanceClient;
        this.eventHandler = eventHandler;
    }

    async initialize(correlationId: string): Promise<void> {
        await this.browserStorage.initialize(correlationId);
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
            return parsedJson && typeof parsedJson === "object"
                ? parsedJson
                : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Reads account from cache, deserializes it into an account entity and returns it.
     * If account is not found from the key, returns null and removes key from map.
     * @param accountKey
     * @returns
     */
    getAccount(accountKey: string): AccountEntity | null {
        this.logger.trace("BrowserCacheManager.getAccount called");
        const serializedAccount = this.browserStorage.getUserData(accountKey);
        if (!serializedAccount) {
            this.removeAccountKeyFromMap(accountKey);
            return null;
        }

        const parsedAccount = this.validateAndParseJson(serializedAccount);
        if (!parsedAccount || !AccountEntity.isAccountEntity(parsedAccount)) {
            this.removeAccountKeyFromMap(accountKey);
            return null;
        }

        return CacheManager.toObject<AccountEntity>(
            new AccountEntity(),
            parsedAccount
        );
    }

    /**
     * set account entity in the platform cache
     * @param account
     */
    async setAccount(
        account: AccountEntity,
        correlationId: string
    ): Promise<void> {
        this.logger.trace("BrowserCacheManager.setAccount called");
        const key = account.generateAccountKey();
        await invokeAsync(
            this.browserStorage.setUserData.bind(this.browserStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(key, JSON.stringify(account), correlationId);
        const wasAdded = this.addAccountKeyToMap(key);

        /**
         * @deprecated - Remove this in next major version in favor of more consistent LOGIN event
         */
        if (
            this.cacheConfig.cacheLocation ===
                BrowserCacheLocation.LocalStorage &&
            wasAdded
        ) {
            this.eventHandler.emitEvent(
                EventType.ACCOUNT_ADDED,
                undefined,
                account.getAccountInfo()
            );
        }
    }

    /**
     * Returns the array of account keys currently cached
     * @returns
     */
    getAccountKeys(): Array<string> {
        return getAccountKeys(this.browserStorage);
    }

    /**
     * Add a new account to the key map
     * @param key
     */
    addAccountKeyToMap(key: string): boolean {
        this.logger.trace("BrowserCacheManager.addAccountKeyToMap called");
        this.logger.tracePii(
            `BrowserCacheManager.addAccountKeyToMap called with key: ${key}`
        );
        const accountKeys = this.getAccountKeys();
        if (accountKeys.indexOf(key) === -1) {
            // Only add key if it does not already exist in the map
            accountKeys.push(key);
            this.browserStorage.setItem(
                StaticCacheKeys.ACCOUNT_KEYS,
                JSON.stringify(accountKeys)
            );
            this.logger.verbose(
                "BrowserCacheManager.addAccountKeyToMap account key added"
            );
            return true;
        } else {
            this.logger.verbose(
                "BrowserCacheManager.addAccountKeyToMap account key already exists in map"
            );
            return false;
        }
    }

    /**
     * Remove an account from the key map
     * @param key
     */
    removeAccountKeyFromMap(key: string): void {
        this.logger.trace("BrowserCacheManager.removeAccountKeyFromMap called");
        this.logger.tracePii(
            `BrowserCacheManager.removeAccountKeyFromMap called with key: ${key}`
        );
        const accountKeys = this.getAccountKeys();
        const removalIndex = accountKeys.indexOf(key);
        if (removalIndex > -1) {
            accountKeys.splice(removalIndex, 1);
            this.browserStorage.setItem(
                StaticCacheKeys.ACCOUNT_KEYS,
                JSON.stringify(accountKeys)
            );
            this.logger.trace(
                "BrowserCacheManager.removeAccountKeyFromMap account key removed"
            );
        } else {
            this.logger.trace(
                "BrowserCacheManager.removeAccountKeyFromMap key not found in existing map"
            );
        }
    }

    /**
     * Extends inherited removeAccount function to include removal of the account key from the map
     * @param key
     */
    async removeAccount(key: string): Promise<void> {
        void super.removeAccount(key);
        this.removeAccountKeyFromMap(key);
    }

    /**
     * Removes credentials associated with the provided account
     * @param account
     */
    async removeAccountContext(account: AccountEntity): Promise<void> {
        await super.removeAccountContext(account);

        /**
         * @deprecated - Remove this in next major version in favor of more consistent LOGOUT event
         */
        if (
            this.cacheConfig.cacheLocation === BrowserCacheLocation.LocalStorage
        ) {
            this.eventHandler.emitEvent(
                EventType.ACCOUNT_REMOVED,
                undefined,
                account.getAccountInfo()
            );
        }
    }

    /**
     * Removes given idToken from the cache and from the key map
     * @param key
     */
    removeIdToken(key: string): void {
        super.removeIdToken(key);
        this.removeTokenKey(key, CredentialType.ID_TOKEN);
    }

    /**
     * Removes given accessToken from the cache and from the key map
     * @param key
     */
    async removeAccessToken(key: string): Promise<void> {
        void super.removeAccessToken(key);
        this.removeTokenKey(key, CredentialType.ACCESS_TOKEN);
    }

    /**
     * Removes given refreshToken from the cache and from the key map
     * @param key
     */
    removeRefreshToken(key: string): void {
        super.removeRefreshToken(key);
        this.removeTokenKey(key, CredentialType.REFRESH_TOKEN);
    }

    /**
     * Gets the keys for the cached tokens associated with this clientId
     * @returns
     */
    getTokenKeys(): TokenKeys {
        return getTokenKeys(this.clientId, this.browserStorage);
    }

    /**
     * Adds the given key to the token key map
     * @param key
     * @param type
     */
    addTokenKey(key: string, type: CredentialType): void {
        this.logger.trace("BrowserCacheManager addTokenKey called");
        const tokenKeys = this.getTokenKeys();

        switch (type) {
            case CredentialType.ID_TOKEN:
                if (tokenKeys.idToken.indexOf(key) === -1) {
                    this.logger.info(
                        "BrowserCacheManager: addTokenKey - idToken added to map"
                    );
                    tokenKeys.idToken.push(key);
                }
                break;
            case CredentialType.ACCESS_TOKEN:
                if (tokenKeys.accessToken.indexOf(key) === -1) {
                    this.logger.info(
                        "BrowserCacheManager: addTokenKey - accessToken added to map"
                    );
                    tokenKeys.accessToken.push(key);
                }
                break;
            case CredentialType.REFRESH_TOKEN:
                if (tokenKeys.refreshToken.indexOf(key) === -1) {
                    this.logger.info(
                        "BrowserCacheManager: addTokenKey - refreshToken added to map"
                    );
                    tokenKeys.refreshToken.push(key);
                }
                break;
            default:
                this.logger.error(
                    `BrowserCacheManager:addTokenKey - CredentialType provided invalid. CredentialType: ${type}`
                );
                throw createClientAuthError(
                    ClientAuthErrorCodes.unexpectedCredentialType
                );
        }

        this.browserStorage.setItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
            JSON.stringify(tokenKeys)
        );
    }

    /**
     * Removes the given key from the token key map
     * @param key
     * @param type
     */
    removeTokenKey(key: string, type: CredentialType): void {
        this.logger.trace("BrowserCacheManager removeTokenKey called");
        const tokenKeys = this.getTokenKeys();

        switch (type) {
            case CredentialType.ID_TOKEN:
                this.logger.infoPii(
                    `BrowserCacheManager: removeTokenKey - attempting to remove idToken with key: ${key} from map`
                );
                const idRemoval = tokenKeys.idToken.indexOf(key);
                if (idRemoval > -1) {
                    this.logger.info(
                        "BrowserCacheManager: removeTokenKey - idToken removed from map"
                    );
                    tokenKeys.idToken.splice(idRemoval, 1);
                } else {
                    this.logger.info(
                        "BrowserCacheManager: removeTokenKey - idToken does not exist in map. Either it was previously removed or it was never added."
                    );
                }
                break;
            case CredentialType.ACCESS_TOKEN:
                this.logger.infoPii(
                    `BrowserCacheManager: removeTokenKey - attempting to remove accessToken with key: ${key} from map`
                );
                const accessRemoval = tokenKeys.accessToken.indexOf(key);
                if (accessRemoval > -1) {
                    this.logger.info(
                        "BrowserCacheManager: removeTokenKey - accessToken removed from map"
                    );
                    tokenKeys.accessToken.splice(accessRemoval, 1);
                } else {
                    this.logger.info(
                        "BrowserCacheManager: removeTokenKey - accessToken does not exist in map. Either it was previously removed or it was never added."
                    );
                }
                break;
            case CredentialType.REFRESH_TOKEN:
                this.logger.infoPii(
                    `BrowserCacheManager: removeTokenKey - attempting to remove refreshToken with key: ${key} from map`
                );
                const refreshRemoval = tokenKeys.refreshToken.indexOf(key);
                if (refreshRemoval > -1) {
                    this.logger.info(
                        "BrowserCacheManager: removeTokenKey - refreshToken removed from map"
                    );
                    tokenKeys.refreshToken.splice(refreshRemoval, 1);
                } else {
                    this.logger.info(
                        "BrowserCacheManager: removeTokenKey - refreshToken does not exist in map. Either it was previously removed or it was never added."
                    );
                }
                break;
            default:
                this.logger.error(
                    `BrowserCacheManager:removeTokenKey - CredentialType provided invalid. CredentialType: ${type}`
                );
                throw createClientAuthError(
                    ClientAuthErrorCodes.unexpectedCredentialType
                );
        }

        this.browserStorage.setItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
            JSON.stringify(tokenKeys)
        );
    }

    /**
     * generates idToken entity from a string
     * @param idTokenKey
     */
    getIdTokenCredential(idTokenKey: string): IdTokenEntity | null {
        const value = this.browserStorage.getUserData(idTokenKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getIdTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(idTokenKey, CredentialType.ID_TOKEN);
            return null;
        }

        const parsedIdToken = this.validateAndParseJson(value);
        if (!parsedIdToken || !CacheHelpers.isIdTokenEntity(parsedIdToken)) {
            this.logger.trace(
                "BrowserCacheManager.getIdTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(idTokenKey, CredentialType.ID_TOKEN);
            return null;
        }

        this.logger.trace(
            "BrowserCacheManager.getIdTokenCredential: cache hit"
        );
        return parsedIdToken as IdTokenEntity;
    }

    /**
     * set IdToken credential to the platform cache
     * @param idToken
     */
    async setIdTokenCredential(
        idToken: IdTokenEntity,
        correlationId: string
    ): Promise<void> {
        this.logger.trace("BrowserCacheManager.setIdTokenCredential called");
        const idTokenKey = CacheHelpers.generateCredentialKey(idToken);

        await invokeAsync(
            this.browserStorage.setUserData.bind(this.browserStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(idTokenKey, JSON.stringify(idToken), correlationId);

        this.addTokenKey(idTokenKey, CredentialType.ID_TOKEN);
    }

    /**
     * generates accessToken entity from a string
     * @param key
     */
    getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null {
        const value = this.browserStorage.getUserData(accessTokenKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getAccessTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
            return null;
        }
        const parsedAccessToken = this.validateAndParseJson(value);
        if (
            !parsedAccessToken ||
            !CacheHelpers.isAccessTokenEntity(parsedAccessToken)
        ) {
            this.logger.trace(
                "BrowserCacheManager.getAccessTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
            return null;
        }

        this.logger.trace(
            "BrowserCacheManager.getAccessTokenCredential: cache hit"
        );
        return parsedAccessToken as AccessTokenEntity;
    }

    /**
     * set accessToken credential to the platform cache
     * @param accessToken
     */
    async setAccessTokenCredential(
        accessToken: AccessTokenEntity,
        correlationId: string
    ): Promise<void> {
        this.logger.trace(
            "BrowserCacheManager.setAccessTokenCredential called"
        );
        const accessTokenKey = CacheHelpers.generateCredentialKey(accessToken);
        await invokeAsync(
            this.browserStorage.setUserData.bind(this.browserStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(accessTokenKey, JSON.stringify(accessToken), correlationId);

        this.addTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
    }

    /**
     * generates refreshToken entity from a string
     * @param refreshTokenKey
     */
    getRefreshTokenCredential(
        refreshTokenKey: string
    ): RefreshTokenEntity | null {
        const value = this.browserStorage.getUserData(refreshTokenKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getRefreshTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
            return null;
        }
        const parsedRefreshToken = this.validateAndParseJson(value);
        if (
            !parsedRefreshToken ||
            !CacheHelpers.isRefreshTokenEntity(parsedRefreshToken)
        ) {
            this.logger.trace(
                "BrowserCacheManager.getRefreshTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
            return null;
        }

        this.logger.trace(
            "BrowserCacheManager.getRefreshTokenCredential: cache hit"
        );
        return parsedRefreshToken as RefreshTokenEntity;
    }

    /**
     * set refreshToken credential to the platform cache
     * @param refreshToken
     */
    async setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity,
        correlationId: string
    ): Promise<void> {
        this.logger.trace(
            "BrowserCacheManager.setRefreshTokenCredential called"
        );
        const refreshTokenKey =
            CacheHelpers.generateCredentialKey(refreshToken);
        await invokeAsync(
            this.browserStorage.setUserData.bind(this.browserStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(refreshTokenKey, JSON.stringify(refreshToken), correlationId);

        this.addTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    getAppMetadata(appMetadataKey: string): AppMetadataEntity | null {
        const value = this.browserStorage.getItem(appMetadataKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getAppMetadata: called, no cache hit"
            );
            return null;
        }

        const parsedMetadata = this.validateAndParseJson(value);
        if (
            !parsedMetadata ||
            !CacheHelpers.isAppMetadataEntity(appMetadataKey, parsedMetadata)
        ) {
            this.logger.trace(
                "BrowserCacheManager.getAppMetadata: called, no cache hit"
            );
            return null;
        }

        this.logger.trace("BrowserCacheManager.getAppMetadata: cache hit");
        return parsedMetadata as AppMetadataEntity;
    }

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata
     */
    setAppMetadata(appMetadata: AppMetadataEntity): void {
        this.logger.trace("BrowserCacheManager.setAppMetadata called");
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        this.browserStorage.setItem(
            appMetadataKey,
            JSON.stringify(appMetadata)
        );
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetryKey
     */
    getServerTelemetry(
        serverTelemetryKey: string
    ): ServerTelemetryEntity | null {
        const value = this.browserStorage.getItem(serverTelemetryKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getServerTelemetry: called, no cache hit"
            );
            return null;
        }
        const parsedEntity = this.validateAndParseJson(value);
        if (
            !parsedEntity ||
            !CacheHelpers.isServerTelemetryEntity(
                serverTelemetryKey,
                parsedEntity
            )
        ) {
            this.logger.trace(
                "BrowserCacheManager.getServerTelemetry: called, no cache hit"
            );
            return null;
        }

        this.logger.trace("BrowserCacheManager.getServerTelemetry: cache hit");
        return parsedEntity as ServerTelemetryEntity;
    }

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    setServerTelemetry(
        serverTelemetryKey: string,
        serverTelemetry: ServerTelemetryEntity
    ): void {
        this.logger.trace("BrowserCacheManager.setServerTelemetry called");
        this.browserStorage.setItem(
            serverTelemetryKey,
            JSON.stringify(serverTelemetry)
        );
    }

    /**
     *
     */
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        const value = this.internalStorage.getItem(key);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getAuthorityMetadata: called, no cache hit"
            );
            return null;
        }
        const parsedMetadata = this.validateAndParseJson(value);
        if (
            parsedMetadata &&
            CacheHelpers.isAuthorityMetadataEntity(key, parsedMetadata)
        ) {
            this.logger.trace(
                "BrowserCacheManager.getAuthorityMetadata: cache hit"
            );
            return parsedMetadata as AuthorityMetadataEntity;
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
        this.internalStorage.setItem(
            InMemoryCacheKeys.WRAPPER_VER,
            wrapperVersion
        );
    }

    /**
     * Returns wrapper metadata from in-memory storage
     */
    getWrapperMetadata(): [string, string] {
        const sku =
            this.internalStorage.getItem(InMemoryCacheKeys.WRAPPER_SKU) ||
            Constants.EMPTY_STRING;
        const version =
            this.internalStorage.getItem(InMemoryCacheKeys.WRAPPER_VER) ||
            Constants.EMPTY_STRING;
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
        const activeAccountKeyFilters = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS
        );
        const activeAccountValueFilters = this.browserStorage.getItem(
            activeAccountKeyFilters
        );
        if (!activeAccountValueFilters) {
            this.logger.trace(
                "BrowserCacheManager.getActiveAccount: No active account filters found"
            );
            return null;
        }
        const activeAccountValueObj = this.validateAndParseJson(
            activeAccountValueFilters
        ) as AccountInfo;
        if (activeAccountValueObj) {
            this.logger.trace(
                "BrowserCacheManager.getActiveAccount: Active account filters schema found"
            );
            return this.getAccountInfoFilteredBy({
                homeAccountId: activeAccountValueObj.homeAccountId,
                localAccountId: activeAccountValueObj.localAccountId,
                tenantId: activeAccountValueObj.tenantId,
            });
        }
        this.logger.trace(
            "BrowserCacheManager.getActiveAccount: No active account found"
        );
        return null;
    }

    /**
     * Sets the active account's localAccountId in cache
     * @param account
     */
    setActiveAccount(account: AccountInfo | null): void {
        const activeAccountKey = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS
        );
        if (account) {
            this.logger.verbose("setActiveAccount: Active account set");
            const activeAccountValue: ActiveAccountFilters = {
                homeAccountId: account.homeAccountId,
                localAccountId: account.localAccountId,
                tenantId: account.tenantId,
            };
            this.browserStorage.setItem(
                activeAccountKey,
                JSON.stringify(activeAccountValue)
            );
        } else {
            this.logger.verbose(
                "setActiveAccount: No account passed, active account not set"
            );
            this.browserStorage.removeItem(activeAccountKey);
        }
        this.eventHandler.emitEvent(EventType.ACTIVE_ACCOUNT_CHANGED);
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const value = this.browserStorage.getItem(throttlingCacheKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getThrottlingCache: called, no cache hit"
            );
            return null;
        }

        const parsedThrottlingCache = this.validateAndParseJson(value);
        if (
            !parsedThrottlingCache ||
            !CacheHelpers.isThrottlingEntity(
                throttlingCacheKey,
                parsedThrottlingCache
            )
        ) {
            this.logger.trace(
                "BrowserCacheManager.getThrottlingCache: called, no cache hit"
            );
            return null;
        }

        this.logger.trace("BrowserCacheManager.getThrottlingCache: cache hit");
        return parsedThrottlingCache as ThrottlingEntity;
    }

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    setThrottlingCache(
        throttlingCacheKey: string,
        throttlingCache: ThrottlingEntity
    ): void {
        this.logger.trace("BrowserCacheManager.setThrottlingCache called");
        this.browserStorage.setItem(
            throttlingCacheKey,
            JSON.stringify(throttlingCache)
        );
    }

    /**
     * Gets cache item with given key.
     * Will retrieve from cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    getTemporaryCache(cacheKey: string, generateKey?: boolean): string | null {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;
        if (this.cacheConfig.storeAuthStateInCookie) {
            const itemCookie = this.cookieStorage.getItem(key);
            if (itemCookie) {
                this.logger.trace(
                    "BrowserCacheManager.getTemporaryCache: storeAuthStateInCookies set to true, retrieving from cookies"
                );
                return itemCookie;
            }
        }

        const value = this.temporaryCacheStorage.getItem(key);
        if (!value) {
            // If temp cache item not found in session/memory, check local storage for items set by old versions
            if (
                this.cacheConfig.cacheLocation ===
                BrowserCacheLocation.LocalStorage
            ) {
                const item = this.browserStorage.getItem(key);
                if (item) {
                    this.logger.trace(
                        "BrowserCacheManager.getTemporaryCache: Temporary cache item found in local storage"
                    );
                    return item;
                }
            }
            this.logger.trace(
                "BrowserCacheManager.getTemporaryCache: No cache item found in local storage"
            );
            return null;
        }
        this.logger.trace(
            "BrowserCacheManager.getTemporaryCache: Temporary cache item returned"
        );
        return value;
    }

    /**
     * Sets the cache item with the key and value given.
     * Stores in cookie if storeAuthStateInCookie is set to true.
     * This can cause cookie overflow if used incorrectly.
     * @param key
     * @param value
     */
    setTemporaryCache(
        cacheKey: string,
        value: string,
        generateKey?: boolean
    ): void {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;

        this.temporaryCacheStorage.setItem(key, value);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.logger.trace(
                "BrowserCacheManager.setTemporaryCache: storeAuthStateInCookie set to true, setting item cookie"
            );
            this.cookieStorage.setItem(
                key,
                value,
                undefined,
                this.cacheConfig.secureCookies
            );
        }
    }

    /**
     * Removes the cache item with the given key.
     * @param key
     */
    removeItem(key: string): void {
        this.browserStorage.removeItem(key);
    }

    /**
     * Removes the temporary cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    removeTemporaryItem(key: string): void {
        this.temporaryCacheStorage.removeItem(key);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.logger.trace(
                "BrowserCacheManager.removeItem: storeAuthStateInCookie is true, clearing item cookie"
            );
            this.cookieStorage.removeItem(key);
        }
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        return this.browserStorage.getKeys();
    }

    /**
     * Clears all cache entries created by MSAL.
     */
    async clear(): Promise<void> {
        // Removes all accounts and their credentials
        await this.removeAllAccounts();
        this.removeAppMetadata();

        // Remove temp storage first to make sure any cookies are cleared
        this.temporaryCacheStorage.getKeys().forEach((cacheKey: string) => {
            if (
                cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1 ||
                cacheKey.indexOf(this.clientId) !== -1
            ) {
                this.removeTemporaryItem(cacheKey);
            }
        });

        // Removes all remaining MSAL cache items
        this.browserStorage.getKeys().forEach((cacheKey: string) => {
            if (
                cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1 ||
                cacheKey.indexOf(this.clientId) !== -1
            ) {
                this.browserStorage.removeItem(cacheKey);
            }
        });

        this.internalStorage.clear();
    }

    /**
     * Clears all access tokes that have claims prior to saving the current one
     * @param performanceClient {IPerformanceClient}
     * @param correlationId {string} correlation id
     * @returns
     */
    async clearTokensAndKeysWithClaims(
        performanceClient: IPerformanceClient,
        correlationId: string
    ): Promise<void> {
        performanceClient.addQueueMeasurement(
            PerformanceEvents.ClearTokensAndKeysWithClaims,
            correlationId
        );

        const tokenKeys = this.getTokenKeys();

        const removedAccessTokens: Array<Promise<void>> = [];
        tokenKeys.accessToken.forEach((key: string) => {
            // if the access token has claims in its key, remove the token key and the token
            const credential = this.getAccessTokenCredential(key);
            if (
                credential?.requestedClaimsHash &&
                key.includes(credential.requestedClaimsHash.toLowerCase())
            ) {
                removedAccessTokens.push(this.removeAccessToken(key));
            }
        });
        await Promise.all(removedAccessTokens);

        // warn if any access tokens are removed
        if (removedAccessTokens.length > 0) {
            this.logger.warning(
                `${removedAccessTokens.length} access tokens with claims in the cache keys have been removed from the cache.`
            );
        }
    }

    /**
     * Prepend msal.<client-id> to each key; Skip for any JSON object as Key (defined schemas do not need the key appended: AccessToken Keys or the upcoming schema)
     * @param key
     * @param addInstanceId
     */
    generateCacheKey(key: string): string {
        const generatedKey = this.validateAndParseJson(key);
        if (!generatedKey) {
            if (StringUtils.startsWith(key, Constants.CACHE_PREFIX)) {
                return key;
            }
            return `${Constants.CACHE_PREFIX}.${this.clientId}.${key}`;
        }

        return JSON.stringify(key);
    }

    /**
     * Reset all temporary cache items
     * @param state
     */
    resetRequestCache(): void {
        this.logger.trace("BrowserCacheManager.resetRequestCache called");

        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.VERIFIER)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.URL_HASH)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST)
        );
        this.setInteractionInProgress(false);
    }

    cacheAuthorizeRequest(
        authCodeRequest: CommonAuthorizationUrlRequest,
        codeVerifier?: string
    ): void {
        this.logger.trace("BrowserCacheManager.cacheAuthorizeRequest called");

        const encodedValue = base64Encode(JSON.stringify(authCodeRequest));
        this.setTemporaryCache(
            TemporaryCacheKeys.REQUEST_PARAMS,
            encodedValue,
            true
        );

        if (codeVerifier) {
            const encodedVerifier = base64Encode(codeVerifier);
            this.setTemporaryCache(
                TemporaryCacheKeys.VERIFIER,
                encodedVerifier,
                true
            );
        }
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    getCachedRequest(): [CommonAuthorizationUrlRequest, string] {
        this.logger.trace("BrowserCacheManager.getCachedRequest called");
        // Get token request from cache and parse as TokenExchangeParameters.
        const encodedTokenRequest = this.getTemporaryCache(
            TemporaryCacheKeys.REQUEST_PARAMS,
            true
        );
        if (!encodedTokenRequest) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.noTokenRequestCacheError
            );
        }
        const encodedVerifier = this.getTemporaryCache(
            TemporaryCacheKeys.VERIFIER,
            true
        );

        let parsedRequest: CommonAuthorizationUrlRequest;
        let verifier = "";
        try {
            parsedRequest = JSON.parse(base64Decode(encodedTokenRequest));
            if (encodedVerifier) {
                verifier = base64Decode(encodedVerifier);
            }
        } catch (e) {
            this.logger.errorPii(`Attempted to parse: ${encodedTokenRequest}`);
            this.logger.error(
                `Parsing cached token request threw with error: ${e}`
            );
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToParseTokenRequestCacheError
            );
        }

        return [parsedRequest, verifier];
    }

    /**
     * Gets cached native request for redirect flows
     */
    getCachedNativeRequest(): NativeTokenRequest | null {
        this.logger.trace("BrowserCacheManager.getCachedNativeRequest called");
        const cachedRequest = this.getTemporaryCache(
            TemporaryCacheKeys.NATIVE_REQUEST,
            true
        );
        if (!cachedRequest) {
            this.logger.trace(
                "BrowserCacheManager.getCachedNativeRequest: No cached native request found"
            );
            return null;
        }

        const parsedRequest = this.validateAndParseJson(
            cachedRequest
        ) as NativeTokenRequest;
        if (!parsedRequest) {
            this.logger.error(
                "BrowserCacheManager.getCachedNativeRequest: Unable to parse native request"
            );
            return null;
        }

        return parsedRequest;
    }

    isInteractionInProgress(matchClientId?: boolean): boolean {
        const clientId = this.getInteractionInProgress()?.clientId;

        if (matchClientId) {
            return clientId === this.clientId;
        } else {
            return !!clientId;
        }
    }

    getInteractionInProgress(): {
        clientId: string;
        type: INTERACTION_TYPE;
    } | null {
        const key = `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        const value = this.getTemporaryCache(key, false);
        try {
            return value ? JSON.parse(value) : null;
        } catch (e) {
            // Remove interaction and other temp keys if interaction status can't be parsed
            this.logger.error(
                `Cannot parse interaction status. Removing temporary cache items and clearing url hash. Retrying interaction should fix the error`
            );
            this.removeTemporaryItem(key);
            this.resetRequestCache();
            clearHash(window);
            return null;
        }
    }

    setInteractionInProgress(
        inProgress: boolean,
        type: INTERACTION_TYPE = INTERACTION_TYPE.SIGNIN
    ): void {
        // Ensure we don't overwrite interaction in progress for a different clientId
        const key = `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        if (inProgress) {
            if (this.getInteractionInProgress()) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                );
            } else {
                // No interaction is in progress
                this.setTemporaryCache(
                    key,
                    JSON.stringify({ clientId: this.clientId, type }),
                    false
                );
            }
        } else if (
            !inProgress &&
            this.getInteractionInProgress()?.clientId === this.clientId
        ) {
            this.removeTemporaryItem(key);
        }
    }

    /**
     * Builds credential entities from AuthenticationResult object and saves the resulting credentials to the cache
     * @param result
     * @param request
     */
    async hydrateCache(
        result: AuthenticationResult,
        request:
            | SilentRequest
            | SsoSilentRequest
            | RedirectRequest
            | PopupRequest
    ): Promise<void> {
        const idTokenEntity = CacheHelpers.createIdTokenEntity(
            result.account?.homeAccountId,
            result.account?.environment,
            result.idToken,
            this.clientId,
            result.tenantId
        );

        let claimsHash;
        if (request.claims) {
            claimsHash = await this.cryptoImpl.hashString(request.claims);
        }

        /**
         * meta data for cache stores time in seconds from epoch
         * AuthenticationResult returns expiresOn and extExpiresOn in milliseconds (as a Date object which is in ms)
         * We need to map these for the cache when building tokens from AuthenticationResult
         *
         * The next MSAL VFuture should map these both to same value if possible
         */

        const accessTokenEntity = CacheHelpers.createAccessTokenEntity(
            result.account?.homeAccountId,
            result.account.environment,
            result.accessToken,
            this.clientId,
            result.tenantId,
            result.scopes.join(" "),
            // Access token expiresOn stored in seconds, converting from AuthenticationResult expiresOn stored as Date
            result.expiresOn
                ? TimeUtils.toSecondsFromDate(result.expiresOn)
                : 0,
            result.extExpiresOn
                ? TimeUtils.toSecondsFromDate(result.extExpiresOn)
                : 0,
            base64Decode,
            undefined, // refreshOn
            result.tokenType as AuthenticationScheme,
            undefined, // userAssertionHash
            request.sshKid,
            request.claims,
            claimsHash
        );

        const cacheRecord = {
            idToken: idTokenEntity,
            accessToken: accessTokenEntity,
        };
        return this.saveCacheRecord(cacheRecord, result.correlationId);
    }

    /**
     * saves a cache record
     * @param cacheRecord {CacheRecord}
     * @param storeInCache {?StoreInCache}
     * @param correlationId {?string} correlation id
     */
    async saveCacheRecord(
        cacheRecord: CacheRecord,
        correlationId: string,
        storeInCache?: StoreInCache
    ): Promise<void> {
        try {
            await super.saveCacheRecord(
                cacheRecord,
                correlationId,
                storeInCache
            );
        } catch (e) {
            if (
                e instanceof CacheError &&
                this.performanceClient &&
                correlationId
            ) {
                try {
                    const tokenKeys = this.getTokenKeys();

                    this.performanceClient.addFields(
                        {
                            cacheRtCount: tokenKeys.refreshToken.length,
                            cacheIdCount: tokenKeys.idToken.length,
                            cacheAtCount: tokenKeys.accessToken.length,
                        },
                        correlationId
                    );
                } catch (e) {}
            }

            throw e;
        }
    }
}

/**
 * Returns a window storage class implementing the IWindowStorage interface that corresponds to the configured cacheLocation.
 * @param cacheLocation
 */
function getStorageImplementation(
    clientId: string,
    cacheLocation: BrowserCacheLocation | string,
    logger: Logger,
    performanceClient: IPerformanceClient
): IWindowStorage<string> {
    try {
        switch (cacheLocation) {
            case BrowserCacheLocation.LocalStorage:
                return new LocalStorage(clientId, logger, performanceClient);
            case BrowserCacheLocation.SessionStorage:
                return new SessionStorage();
            case BrowserCacheLocation.MemoryStorage:
            default:
                break;
        }
    } catch (e) {
        logger.error(e as string);
    }

    return new MemoryStorage();
}

export const DEFAULT_BROWSER_CACHE_MANAGER = (
    clientId: string,
    logger: Logger,
    performanceClient: IPerformanceClient,
    eventHandler: EventHandler
): BrowserCacheManager => {
    const cacheOptions: Required<CacheOptions> = {
        cacheLocation: BrowserCacheLocation.MemoryStorage,
        temporaryCacheLocation: BrowserCacheLocation.MemoryStorage,
        storeAuthStateInCookie: false,
        secureCookies: false,
        cacheMigrationEnabled: false,
        claimsBasedCachingEnabled: false,
    };
    return new BrowserCacheManager(
        clientId,
        cacheOptions,
        DEFAULT_CRYPTO_IMPLEMENTATION,
        logger,
        performanceClient,
        eventHandler
    );
};
