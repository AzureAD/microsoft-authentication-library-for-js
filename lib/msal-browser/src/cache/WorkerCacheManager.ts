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
    AsyncCacheManager,
    AuthenticationScheme,
    AuthorityMetadataEntity,
    CacheError,
    CacheHelpers,
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
import { MemoryStorage } from "./MemoryStorage.js";
import { NativeTokenRequest } from "../broker/nativeBroker/NativeRequest.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { base64Decode } from "../encode/Base64Decode.js";
import { base64Encode } from "../encode/Base64Encode.js";
import { getAccountKeysAsync, getTokenKeysAsync } from "./CacheHelpers.js";
import { EventType } from "../event/EventType.js";
import { EventHandler } from "../event/EventHandler.js";
import { AsyncMemoryStorage } from "./AsyncMemoryStorage.js";
import { IAsyncStorage } from "./IAsyncStorage.js";

/**
 * This class implements the cache storage interface for MSAL through browser local or session storage.
 * Cookies are only used if storeAuthStateInCookie is true, and are only used for
 * parameters such as state and nonce, generally.
 */
export class WorkerCacheManager extends AsyncCacheManager {
    // Cache configuration, either set by user or default values.
    protected cacheConfig: Required<CacheOptions>;
    // Window storage object (either local or sessionStorage)
    protected workerStorage: IAsyncStorage<string>;
    // Internal in-memory storage object used for data used by msal that does not need to persist across page loads
    protected internalStorage: MemoryStorage<string>;
    // Temporary cache
    protected temporaryCacheStorage: IAsyncStorage<string>;
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
        this.performanceClient = performanceClient;

        this.workerStorage = new AsyncMemoryStorage(this.logger, this.clientId, this.performanceClient);
    
        this.temporaryCacheStorage = new AsyncMemoryStorage(this.logger, this.clientId, this.performanceClient);

        this.eventHandler = eventHandler;
    }

    async initialize(): Promise<void> {
        await this.workerStorage.initialize();
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
    async getAccount(accountKey: string): Promise<AccountEntity | null> {
        this.logger.trace("WorkerCacheManager.getAccount called");
        const serializedAccount = await this.workerStorage.getItem(accountKey);
        if (!serializedAccount) {
            await this.removeAccountKeyFromMap(accountKey);
            return null;
        }

        const parsedAccount = this.validateAndParseJson(serializedAccount);
        if (!parsedAccount || !AccountEntity.isAccountEntity(parsedAccount)) {
            await this.removeAccountKeyFromMap(accountKey);
            return null;
        }

        return AsyncCacheManager.toObject<AccountEntity>(
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
    ): Promise<void> {
        this.logger.trace("WorkerCacheManager.setAccount called");
        const key = account.generateAccountKey();
        await invokeAsync(
            this.workerStorage.setItem.bind(this.workerStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(key, JSON.stringify(account));
        const wasAdded = await this.addAccountKeyToMap(key);

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
    async getAccountKeys(): Promise<Array<string>> {
        return getAccountKeysAsync(this.workerStorage);
    }

    /**
     * Add a new account to the key map
     * @param key
     */
    async addAccountKeyToMap(key: string): Promise<boolean> {
        this.logger.trace("WorkerCacheManager.addAccountKeyToMap called");
        this.logger.tracePii(
            `WorkerCacheManager.addAccountKeyToMap called with key: ${key}`
        );
        const accountKeys = await this.getAccountKeys();
        if (accountKeys.indexOf(key) === -1) {
            // Only add key if it does not already exist in the map
            accountKeys.push(key);
            await this.workerStorage.setItem(
                StaticCacheKeys.ACCOUNT_KEYS,
                JSON.stringify(accountKeys)
            );
            this.logger.verbose(
                "WorkerCacheManager.addAccountKeyToMap account key added"
            );
            return true;
        } else {
            this.logger.verbose(
                "WorkerCacheManager.addAccountKeyToMap account key already exists in map"
            );
            return false;
        }
    }

    /**
     * Remove an account from the key map
     * @param key
     */
    async removeAccountKeyFromMap(key: string): Promise<void> {
        this.logger.trace("WorkerCacheManager.removeAccountKeyFromMap called");
        this.logger.tracePii(
            `WorkerCacheManager.removeAccountKeyFromMap called with key: ${key}`
        );
        const accountKeys = await this.getAccountKeys();
        const removalIndex = accountKeys.indexOf(key);
        if (removalIndex > -1) {
            accountKeys.splice(removalIndex, 1);
            await this.workerStorage.setItem(
                StaticCacheKeys.ACCOUNT_KEYS,
                JSON.stringify(accountKeys)
            );
            this.logger.trace(
                "WorkerCacheManager.removeAccountKeyFromMap account key removed"
            );
        } else {
            this.logger.trace(
                "WorkerCacheManager.removeAccountKeyFromMap key not found in existing map"
            );
        }
    }

    /**
     * Extends inherited removeAccount function to include removal of the account key from the map
     * @param key
     */
    async removeAccount(key: string): Promise<void> {
        void await super.removeAccount(key);
        await this.removeAccountKeyFromMap(key);
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
    async removeIdToken(key: string): Promise<void> {
        await super.removeIdToken(key);
        await this.removeTokenKey(key, CredentialType.ID_TOKEN);
    }

    /**
     * Removes given accessToken from the cache and from the key map
     * @param key
     */
    async removeAccessToken(key: string): Promise<void> {
        void await super.removeAccessToken(key);
        await this.removeTokenKey(key, CredentialType.ACCESS_TOKEN);
    }

    /**
     * Removes given refreshToken from the cache and from the key map
     * @param key
     */
    async removeRefreshToken(key: string): Promise<void> {
        await super.removeRefreshToken(key);
        await this.removeTokenKey(key, CredentialType.REFRESH_TOKEN);
    }

    /**
     * Gets the keys for the cached tokens associated with this clientId
     * @returns
     */
    async getTokenKeys(): Promise<TokenKeys> {
        return getTokenKeysAsync(this.clientId, this.workerStorage);
    }

    /**
     * Adds the given key to the token key map
     * @param key
     * @param type
     */
    async addTokenKey(key: string, type: CredentialType): Promise<void> {
        this.logger.trace("WorkerCacheManager addTokenKey called");
        const tokenKeys = await this.getTokenKeys();

        switch (type) {
            case CredentialType.ID_TOKEN:
                if (tokenKeys.idToken.indexOf(key) === -1) {
                    this.logger.info(
                        "WorkerCacheManager: addTokenKey - idToken added to map"
                    );
                    tokenKeys.idToken.push(key);
                }
                break;
            case CredentialType.ACCESS_TOKEN:
                if (tokenKeys.accessToken.indexOf(key) === -1) {
                    this.logger.info(
                        "WorkerCacheManager: addTokenKey - accessToken added to map"
                    );
                    tokenKeys.accessToken.push(key);
                }
                break;
            case CredentialType.REFRESH_TOKEN:
                if (tokenKeys.refreshToken.indexOf(key) === -1) {
                    this.logger.info(
                        "WorkerCacheManager: addTokenKey - refreshToken added to map"
                    );
                    tokenKeys.refreshToken.push(key);
                }
                break;
            default:
                this.logger.error(
                    `WorkerCacheManager:addTokenKey - CredentialType provided invalid. CredentialType: ${type}`
                );
                throw createClientAuthError(
                    ClientAuthErrorCodes.unexpectedCredentialType
                );
        }

        await this.workerStorage.setItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
            JSON.stringify(tokenKeys)
        );
    }

    /**
     * Removes the given key from the token key map
     * @param key
     * @param type
     */
    async removeTokenKey(key: string, type: CredentialType): Promise<void> {
        this.logger.trace("WorkerCacheManager removeTokenKey called");
        const tokenKeys = await this.getTokenKeys();

        switch (type) {
            case CredentialType.ID_TOKEN: {
                this.logger.infoPii(
                    `WorkerCacheManager: removeTokenKey - attempting to remove idToken with key: ${key} from map`
                );
                const idRemoval = tokenKeys.idToken.indexOf(key);
                if (idRemoval > -1) {
                    this.logger.info(
                        "WorkerCacheManager: removeTokenKey - idToken removed from map"
                    );
                    tokenKeys.idToken.splice(idRemoval, 1);
                } else {
                    this.logger.info(
                        "WorkerCacheManager: removeTokenKey - idToken does not exist in map. Either it was previously removed or it was never added."
                    );
                }
                break;
            }
            case CredentialType.ACCESS_TOKEN: {
                this.logger.infoPii(
                    `WorkerCacheManager: removeTokenKey - attempting to remove accessToken with key: ${key} from map`
                );
                const accessRemoval = tokenKeys.accessToken.indexOf(key);
                if (accessRemoval > -1) {
                    this.logger.info(
                        "WorkerCacheManager: removeTokenKey - accessToken removed from map"
                    );
                    tokenKeys.accessToken.splice(accessRemoval, 1);
                } else {
                    this.logger.info(
                        "WorkerCacheManager: removeTokenKey - accessToken does not exist in map. Either it was previously removed or it was never added."
                    );
                }
                break;
            }
            case CredentialType.REFRESH_TOKEN: {
                this.logger.infoPii(
                    `WorkerCacheManager: removeTokenKey - attempting to remove refreshToken with key: ${key} from map`
                );
                const refreshRemoval = tokenKeys.refreshToken.indexOf(key);
                if (refreshRemoval > -1) {
                    this.logger.info(
                        "WorkerCacheManager: removeTokenKey - refreshToken removed from map"
                    );
                    tokenKeys.refreshToken.splice(refreshRemoval, 1);
                } else {
                    this.logger.info(
                        "WorkerCacheManager: removeTokenKey - refreshToken does not exist in map. Either it was previously removed or it was never added."
                    );
                }
                break;
            }
            default:
                this.logger.error(
                    `WorkerCacheManager:removeTokenKey - CredentialType provided invalid. CredentialType: ${type}`
                );
                throw createClientAuthError(
                    ClientAuthErrorCodes.unexpectedCredentialType
                );
        }

        await this.workerStorage.setItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
            JSON.stringify(tokenKeys)
        );
    }

    /**
     * generates idToken entity from a string
     * @param idTokenKey
     */
    async getIdTokenCredential(idTokenKey: string): Promise<IdTokenEntity | null> {
        const value = await this.workerStorage.getItem(idTokenKey);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getIdTokenCredential: called, no cache hit"
            );
            await this.removeTokenKey(idTokenKey, CredentialType.ID_TOKEN);
            return null;
        }

        const parsedIdToken = this.validateAndParseJson(value);
        if (!parsedIdToken || !CacheHelpers.isIdTokenEntity(parsedIdToken)) {
            this.logger.trace(
                "WorkerCacheManager.getIdTokenCredential: called, no cache hit"
            );
            await this.removeTokenKey(idTokenKey, CredentialType.ID_TOKEN);
            return null;
        }

        this.logger.trace(
            "WorkerCacheManager.getIdTokenCredential: cache hit"
        );
        return parsedIdToken as IdTokenEntity;
    }

    /**
     * set IdToken credential to the platform cache
     * @param idToken
     */
    async setIdTokenCredential(
        idToken: IdTokenEntity,
    ): Promise<void> {
        this.logger.trace("WorkerCacheManager.setIdTokenCredential called");
        const idTokenKey = CacheHelpers.generateCredentialKey(idToken);

        await invokeAsync(
            this.workerStorage.setItem.bind(this.workerStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(idTokenKey, JSON.stringify(idToken));

        await this.addTokenKey(idTokenKey, CredentialType.ID_TOKEN);
    }

    /**
     * generates accessToken entity from a string
     * @param key
     */
    async getAccessTokenCredential(accessTokenKey: string): Promise<AccessTokenEntity | null> {
        const value = await this.workerStorage.getItem(accessTokenKey);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getAccessTokenCredential: called, no cache hit"
            );
            await this.removeTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
            return null;
        }
        const parsedAccessToken = this.validateAndParseJson(value);
        if (
            !parsedAccessToken ||
            !CacheHelpers.isAccessTokenEntity(parsedAccessToken)
        ) {
            this.logger.trace(
                "WorkerCacheManager.getAccessTokenCredential: called, no cache hit"
            );
            await this.removeTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
            return null;
        }

        this.logger.trace(
            "WorkerCacheManager.getAccessTokenCredential: cache hit"
        );
        return parsedAccessToken as AccessTokenEntity;
    }

    /**
     * set accessToken credential to the platform cache
     * @param accessToken
     */
    async setAccessTokenCredential(
        accessToken: AccessTokenEntity,
    ): Promise<void> {
        this.logger.trace(
            "WorkerCacheManager.setAccessTokenCredential called"
        );
        const accessTokenKey = CacheHelpers.generateCredentialKey(accessToken);
        await invokeAsync(
            this.workerStorage.setItem.bind(this.workerStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(accessTokenKey, JSON.stringify(accessToken));

        await this.addTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
    }

    /**
     * generates refreshToken entity from a string
     * @param refreshTokenKey
     */
    async getRefreshTokenCredential(
        refreshTokenKey: string
    ): Promise<RefreshTokenEntity | null> {
        const value = await this.workerStorage.getItem(refreshTokenKey);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getRefreshTokenCredential: called, no cache hit"
            );
            await this.removeTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
            return null;
        }
        const parsedRefreshToken = this.validateAndParseJson(value);
        if (
            !parsedRefreshToken ||
            !CacheHelpers.isRefreshTokenEntity(parsedRefreshToken)
        ) {
            this.logger.trace(
                "WorkerCacheManager.getRefreshTokenCredential: called, no cache hit"
            );
            await this.removeTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
            return null;
        }

        this.logger.trace(
            "WorkerCacheManager.getRefreshTokenCredential: cache hit"
        );
        return parsedRefreshToken as RefreshTokenEntity;
    }

    /**
     * set refreshToken credential to the platform cache
     * @param refreshToken
     */
    async setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity,
    ): Promise<void> {
        this.logger.trace(
            "WorkerCacheManager.setRefreshTokenCredential called"
        );
        const refreshTokenKey =
            CacheHelpers.generateCredentialKey(refreshToken);
        await invokeAsync(
            this.workerStorage.setItem.bind(this.workerStorage),
            PerformanceEvents.SetUserData,
            this.logger,
            this.performanceClient
        )(refreshTokenKey, JSON.stringify(refreshToken));

        await this.addTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    async getAppMetadata(appMetadataKey: string): Promise<AppMetadataEntity | null> {
        const value = await this.workerStorage.getItem(appMetadataKey);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getAppMetadata: called, no cache hit"
            );
            return null;
        }

        const parsedMetadata = this.validateAndParseJson(value);
        if (
            !parsedMetadata ||
            !CacheHelpers.isAppMetadataEntity(appMetadataKey, parsedMetadata)
        ) {
            this.logger.trace(
                "WorkerCacheManager.getAppMetadata: called, no cache hit"
            );
            return null;
        }

        this.logger.trace("WorkerCacheManager.getAppMetadata: cache hit");
        return parsedMetadata as AppMetadataEntity;
    }

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata
     */
    async setAppMetadata(appMetadata: AppMetadataEntity): Promise<void> {
        this.logger.trace("WorkerCacheManager.setAppMetadata called");
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        await this.workerStorage.setItem(
            appMetadataKey,
            JSON.stringify(appMetadata)
        );
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetryKey
     */
    async getServerTelemetry(
        serverTelemetryKey: string
    ): Promise<ServerTelemetryEntity | null> {
        const value = await this.workerStorage.getItem(serverTelemetryKey);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getServerTelemetry: called, no cache hit"
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
                "WorkerCacheManager.getServerTelemetry: called, no cache hit"
            );
            return null;
        }

        this.logger.trace("WorkerCacheManager.getServerTelemetry: cache hit");
        return parsedEntity as ServerTelemetryEntity;
    }

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey
     * @param serverTelemetry
     */
    async setServerTelemetry(
        serverTelemetryKey: string,
        serverTelemetry: ServerTelemetryEntity
    ): Promise<void> {
        this.logger.trace("WorkerCacheManager.setServerTelemetry called");
        await this.workerStorage.setItem(
            serverTelemetryKey,
            JSON.stringify(serverTelemetry)
        );
    }

    /**
     *
     */
    async getAuthorityMetadata(key: string): Promise<AuthorityMetadataEntity | null> {
        const value = this.internalStorage.getItem(key);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getAuthorityMetadata: called, no cache hit"
            );
            return null;
        }
        const parsedMetadata = this.validateAndParseJson(value);
        if (
            parsedMetadata &&
            CacheHelpers.isAuthorityMetadataEntity(key, parsedMetadata)
        ) {
            this.logger.trace(
                "WorkerCacheManager.getAuthorityMetadata: cache hit"
            );
            return parsedMetadata as AuthorityMetadataEntity;
        }
        return null;
    }

    /**
     *
     */
    async getAuthorityMetadataKeys(): Promise<Array<string>> {
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
    async setAuthorityMetadata(key: string, entity: AuthorityMetadataEntity): Promise<void> {
        this.logger.trace("WorkerCacheManager.setAuthorityMetadata called");
        this.internalStorage.setItem(key, JSON.stringify(entity));
    }

    /**
     * Gets the active account
     */
    async getActiveAccount(): Promise<AccountInfo | null> {
        const activeAccountKeyFilters = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS
        );
        const activeAccountValueFilters = await this.workerStorage.getItem(
            activeAccountKeyFilters
        );
        if (!activeAccountValueFilters) {
            this.logger.trace(
                "WorkerCacheManager.getActiveAccount: No active account filters found"
            );
            return null;
        }
        const activeAccountValueObj = this.validateAndParseJson(
            activeAccountValueFilters
        ) as AccountInfo;
        if (activeAccountValueObj) {
            this.logger.trace(
                "WorkerCacheManager.getActiveAccount: Active account filters schema found"
            );
            return this.getAccountInfoFilteredBy({
                homeAccountId: activeAccountValueObj.homeAccountId,
                localAccountId: activeAccountValueObj.localAccountId,
                tenantId: activeAccountValueObj.tenantId,
            });
        }
        this.logger.trace(
            "WorkerCacheManager.getActiveAccount: No active account found"
        );
        return null;
    }

    /**
     * Sets the active account's localAccountId in cache
     * @param account
     */
    async setActiveAccount(account: AccountInfo | null): Promise<void> {
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
            await this.workerStorage.setItem(
                activeAccountKey,
                JSON.stringify(activeAccountValue)
            );
        } else {
            this.logger.verbose(
                "setActiveAccount: No account passed, active account not set"
            );
            await this.workerStorage.removeItem(activeAccountKey);
        }
        this.eventHandler.emitEvent(EventType.ACTIVE_ACCOUNT_CHANGED);
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    async getThrottlingCache(throttlingCacheKey: string): Promise<ThrottlingEntity | null> {
        const value = await this.workerStorage.getItem(throttlingCacheKey);
        if (!value) {
            this.logger.trace(
                "WorkerCacheManager.getThrottlingCache: called, no cache hit"
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
                "WorkerCacheManager.getThrottlingCache: called, no cache hit"
            );
            return null;
        }

        this.logger.trace("WorkerCacheManager.getThrottlingCache: cache hit");
        return parsedThrottlingCache as ThrottlingEntity;
    }

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey
     * @param throttlingCache
     */
    async setThrottlingCache(
        throttlingCacheKey: string,
        throttlingCache: ThrottlingEntity
    ): Promise<void> {
        this.logger.trace("WorkerCacheManager.setThrottlingCache called");
        await this.workerStorage.setItem(
            throttlingCacheKey,
            JSON.stringify(throttlingCache)
        );
    }

    /**
     * Gets cache item with given key.
     * Will retrieve from cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    async getTemporaryCache(cacheKey: string, generateKey?: boolean): Promise<string | null> {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;

        const value = await this.temporaryCacheStorage.getItem(key);
        if (!value) {
            // If temp cache item not found in session/memory, check local storage for items set by old versions
            if (
                this.cacheConfig.cacheLocation ===
                BrowserCacheLocation.LocalStorage
            ) {
                const item = await this.workerStorage.getItem(key);
                if (item) {
                    this.logger.trace(
                        "WorkerCacheManager.getTemporaryCache: Temporary cache item found in local storage"
                    );
                    return item;
                }
            }
            this.logger.trace(
                "WorkerCacheManager.getTemporaryCache: No cache item found in local storage"
            );
            return null;
        }
        this.logger.trace(
            "WorkerCacheManager.getTemporaryCache: Temporary cache item returned"
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
    async setTemporaryCache(
        cacheKey: string,
        value: string,
        generateKey?: boolean
    ): Promise<void> {
        const key = generateKey ? this.generateCacheKey(cacheKey) : cacheKey;

        await this.temporaryCacheStorage.setItem(key, value);
    }

    /**
     * Removes the cache item with the given key.
     * @param key
     */
    async removeItem(key: string): Promise<void> {
        await this.workerStorage.removeItem(key);
    }

    /**
     * Removes the temporary cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    async removeTemporaryItem(key: string): Promise<void> {
        await this.temporaryCacheStorage.removeItem(key);
    }

    /**
     * Gets all keys in window.
     */
    async getKeys(): Promise<string[]> {
        return this.workerStorage.getKeys();
    }

    /**
     * Clears all cache entries created by MSAL.
     */
    async clear(): Promise<void> {
        // Removes all accounts and their credentials
        await this.removeAllAccounts();
        await this.removeAppMetadata();

        // Remove temp storage first to make sure any cookies are cleared
        const tempKeys = await this.temporaryCacheStorage.getKeys();
        for (const cacheKey of tempKeys) {
            if (
                cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1 ||
                cacheKey.indexOf(this.clientId) !== -1
            ) {
                await this.removeTemporaryItem(cacheKey);
            }
        }

        // Removes all remaining MSAL cache items
        const workerKeys = await this.workerStorage.getKeys();
        for (const cacheKey of workerKeys) {
            if (
                cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1 ||
                cacheKey.indexOf(this.clientId) !== -1
            ) {
                await this.workerStorage.removeItem(cacheKey);
            }
        }

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

        const tokenKeys = await this.getTokenKeys();

        const removedAccessTokens: Array<Promise<void>> = [];
        for (const key of tokenKeys.accessToken) {
            // if the access token has claims in its key, remove the token key and the token
            const credential = await this.getAccessTokenCredential(key);
            if (
                credential?.requestedClaimsHash &&
                key.includes(credential.requestedClaimsHash.toLowerCase())
            ) {
                removedAccessTokens.push(this.removeAccessToken(key));
            }
        }
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
    async resetRequestCache(): Promise<void> {
        this.logger.trace("WorkerCacheManager.resetRequestCache called");

        await this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS)
        );
        await this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.VERIFIER)
        );
        await this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI)
        );
        await this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.URL_HASH)
        );
        await this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST)
        );
        await this.setInteractionInProgress(false);
    }

    async cacheAuthorizeRequest(
        authCodeRequest: CommonAuthorizationUrlRequest,
        codeVerifier?: string
    ): Promise<void> {
        this.logger.trace("WorkerCacheManager.cacheAuthorizeRequest called");

        const encodedValue = base64Encode(JSON.stringify(authCodeRequest));
        await this.setTemporaryCache(
            TemporaryCacheKeys.REQUEST_PARAMS,
            encodedValue,
            true
        );

        if (codeVerifier) {
            const encodedVerifier = base64Encode(codeVerifier);
            await this.setTemporaryCache(
                TemporaryCacheKeys.VERIFIER,
                encodedVerifier,
                true
            );
        }
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    async getCachedRequest(): Promise<[CommonAuthorizationUrlRequest, string]> {
        this.logger.trace("WorkerCacheManager.getCachedRequest called");
        // Get token request from cache and parse as TokenExchangeParameters.
        const encodedTokenRequest = await this.getTemporaryCache(
            TemporaryCacheKeys.REQUEST_PARAMS,
            true
        );
        if (!encodedTokenRequest) {
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.noTokenRequestCacheError
            );
        }
        const encodedVerifier = await this.getTemporaryCache(
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
    async getCachedNativeRequest(): Promise<NativeTokenRequest | null> {
        this.logger.trace("WorkerCacheManager.getCachedNativeRequest called");
        const cachedRequest = await this.getTemporaryCache(
            TemporaryCacheKeys.NATIVE_REQUEST,
            true
        );
        if (!cachedRequest) {
            this.logger.trace(
                "WorkerCacheManager.getCachedNativeRequest: No cached native request found"
            );
            return null;
        }

        const parsedRequest = this.validateAndParseJson(
            cachedRequest
        ) as NativeTokenRequest;
        if (!parsedRequest) {
            this.logger.error(
                "WorkerCacheManager.getCachedNativeRequest: Unable to parse native request"
            );
            return null;
        }

        return parsedRequest;
    }

    async isInteractionInProgress(matchClientId?: boolean): Promise<boolean> {
        const interaction = await this.getInteractionInProgress();
        const clientId = interaction?.clientId;

        if (matchClientId) {
            return clientId === this.clientId;
        } else {
            return !!clientId;
        }
    }

    async getInteractionInProgress(): Promise<{
        clientId: string;
        type: INTERACTION_TYPE;
    } | null> {
        const key = `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        const value = await this.getTemporaryCache(key, false);
        return value ? JSON.parse(value) : null;
    }

    async setInteractionInProgress(
        inProgress: boolean,
        type: INTERACTION_TYPE = INTERACTION_TYPE.SIGNIN
    ): Promise<void> {
        // Ensure we don't overwrite interaction in progress for a different clientId
        const key = `${Constants.CACHE_PREFIX}.${TemporaryCacheKeys.INTERACTION_STATUS_KEY}`;
        if (inProgress) {
            if (await this.getInteractionInProgress()) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                );
            } else {
                // No interaction is in progress
                await this.setTemporaryCache(
                    key,
                    JSON.stringify({ clientId: this.clientId, type }),
                    false
                );
            }
        } else if (
            !inProgress &&
            (await this.getInteractionInProgress())?.clientId === this.clientId
        ) {
            await this.removeTemporaryItem(key);
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
                    const tokenKeys = await this.getTokenKeys();

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

export const DEFAULT_WORKER_CACHE_MANAGER = (
    clientId: string,
    logger: Logger,
    performanceClient: IPerformanceClient,
    eventHandler: EventHandler
): WorkerCacheManager => {
    const cacheOptions: Required<CacheOptions> = {
        cacheLocation: BrowserCacheLocation.MemoryStorage,
        temporaryCacheLocation: BrowserCacheLocation.MemoryStorage,
        storeAuthStateInCookie: false,
        secureCookies: false,
        cacheMigrationEnabled: false,
        claimsBasedCachingEnabled: false,
    };
    return new WorkerCacheManager(
        clientId,
        cacheOptions,
        DEFAULT_CRYPTO_IMPLEMENTATION,
        logger,
        performanceClient,
        eventHandler
    );
};
