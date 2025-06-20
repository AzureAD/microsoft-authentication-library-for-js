/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Constants,
    PersistentCacheKeys,
    StringUtils,
    CommonAuthorizationCodeRequest,
    ICrypto,
    AccountEntity,
    IdTokenEntity,
    AccessTokenEntity,
    RefreshTokenEntity,
    AppMetadataEntity,
    CacheManager,
    ServerTelemetryEntity,
    ThrottlingEntity,
    ProtocolUtils,
    Logger,
    AuthorityMetadataEntity,
    DEFAULT_CRYPTO_IMPLEMENTATION,
    AccountInfo,
    ActiveAccountFilters,
    CcsCredential,
    CcsCredentialType,
    AuthToken,
    ValidCredentialType,
    TokenKeys,
    CredentialType,
    CacheRecord,
    AuthenticationScheme,
    createClientAuthError,
    ClientAuthErrorCodes,
    PerformanceEvents,
    IPerformanceClient,
    StaticAuthorityOptions,
    CacheHelpers,
    StoreInCache,
    CacheError,
    CacheErrorCodes,
    createCacheError,
} from "@azure/msal-common/browser";
import { CacheOptions } from "../config/Configuration.js";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError.js";
import {
    BrowserCacheLocation,
    InteractionType,
    TemporaryCacheKeys,
    InMemoryCacheKeys,
    StaticCacheKeys,
} from "../utils/BrowserConstants.js";
import { LocalStorage } from "./LocalStorage.js";
import { SessionStorage } from "./SessionStorage.js";
import { MemoryStorage } from "./MemoryStorage.js";
import { IWindowStorage } from "./IWindowStorage.js";
import { extractBrowserRequestState } from "../utils/BrowserProtocolUtils.js";
import { NativeTokenRequest } from "../broker/nativeBroker/NativeRequest.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { SilentRequest } from "../request/SilentRequest.js";
import { SsoSilentRequest } from "../request/SsoSilentRequest.js";
import { RedirectRequest } from "../request/RedirectRequest.js";
import { PopupRequest } from "../request/PopupRequest.js";
import { base64Decode } from "../encode/Base64Decode.js";
import { base64Encode } from "../encode/Base64Encode.js";
import { CookieStorage } from "./CookieStorage.js";
import { version } from "../packageMetadata.js";

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
    protected performanceClient?: IPerformanceClient;

    constructor(
        clientId: string,
        cacheConfig: Required<CacheOptions>,
        cryptoImpl: ICrypto,
        logger: Logger,
        staticAuthorityOptions?: StaticAuthorityOptions,
        performanceClient?: IPerformanceClient
    ) {
        super(clientId, cryptoImpl, logger, staticAuthorityOptions);
        this.cacheConfig = cacheConfig;
        this.logger = logger;
        this.internalStorage = new MemoryStorage();
        this.browserStorage = this.setupBrowserStorage(
            this.cacheConfig.cacheLocation
        );
        this.temporaryCacheStorage = this.setupBrowserStorage(
            this.cacheConfig.temporaryCacheLocation
        );
        this.cookieStorage = new CookieStorage();

        // Migrate cache entries from older versions of MSAL.
        if (cacheConfig.cacheMigrationEnabled) {
            this.migrateCacheEntries();
            this.createKeyMaps();
        }

        this.performanceClient = performanceClient;
    }

    /**
     * Returns a window storage class implementing the IWindowStorage interface that corresponds to the configured cacheLocation.
     * @param cacheLocation
     */
    protected setupBrowserStorage(
        cacheLocation: BrowserCacheLocation | string
    ): IWindowStorage<string> {
        try {
            switch (cacheLocation) {
                case BrowserCacheLocation.LocalStorage:
                    return new LocalStorage();
                case BrowserCacheLocation.SessionStorage:
                    return new SessionStorage();
                case BrowserCacheLocation.MemoryStorage:
                default:
                    break;
            }
        } catch (e) {
            this.logger.error(e as string);
        }
        this.cacheConfig.cacheLocation = BrowserCacheLocation.MemoryStorage;
        return new MemoryStorage();
    }

    /**
     * Migrate all old cache entries to new schema. No rollback supported.
     * @param storeAuthStateInCookie
     */
    protected migrateCacheEntries(): void {
        const previousVersion = this.browserStorage.getItem(
            StaticCacheKeys.VERSION
        );
        if (previousVersion) {
            this.logger.info(
                `MSAL.js was last initialized with version ${previousVersion}`
            );
        }

        if (previousVersion !== version) {
            this.browserStorage.setItem(StaticCacheKeys.VERSION, version);
        }

        const idTokenKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ID_TOKEN}`;
        const clientInfoKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.CLIENT_INFO}`;
        const errorKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR}`;
        const errorDescKey = `${Constants.CACHE_PREFIX}.${PersistentCacheKeys.ERROR_DESC}`;

        const idTokenValue = this.browserStorage.getItem(idTokenKey);
        const clientInfoValue = this.browserStorage.getItem(clientInfoKey);
        const errorValue = this.browserStorage.getItem(errorKey);
        const errorDescValue = this.browserStorage.getItem(errorDescKey);

        const values = [
            idTokenValue,
            clientInfoValue,
            errorValue,
            errorDescValue,
        ];
        const keysToMigrate = [
            PersistentCacheKeys.ID_TOKEN,
            PersistentCacheKeys.CLIENT_INFO,
            PersistentCacheKeys.ERROR,
            PersistentCacheKeys.ERROR_DESC,
        ];

        keysToMigrate.forEach((cacheKey: string, index: number) => {
            const value = values[index];
            if (value) {
                this.setTemporaryCache(cacheKey, value, true);
            }
        });
    }

    /**
     * Searches all cache entries for MSAL accounts and creates the account key map
     * This is used to migrate users from older versions of MSAL which did not create the map.
     * @returns
     */
    private createKeyMaps(): void {
        this.logger.trace("BrowserCacheManager - createKeyMaps called.");
        const correlationId = this.cryptoImpl.createNewGuid();
        const accountKeys = this.getItem(StaticCacheKeys.ACCOUNT_KEYS);
        const tokenKeys = this.getItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`
        );
        if (accountKeys && tokenKeys) {
            this.logger.verbose(
                "BrowserCacheManager:createKeyMaps - account and token key maps already exist, skipping migration."
            );
            // Key maps already exist, no need to iterate through cache
            return;
        }

        const allKeys = this.browserStorage.getKeys();
        allKeys.forEach((key) => {
            if (this.isCredentialKey(key)) {
                // Get item, parse, validate and write key to map
                const value = this.getItem(key);
                if (value) {
                    const credObj = this.validateAndParseJson(value);
                    if (credObj && credObj.hasOwnProperty("credentialType")) {
                        switch (credObj["credentialType"]) {
                            case CredentialType.ID_TOKEN:
                                if (CacheHelpers.isIdTokenEntity(credObj)) {
                                    this.logger.trace(
                                        "BrowserCacheManager:createKeyMaps - idToken found, saving key to token key map"
                                    );
                                    this.logger.tracePii(
                                        `BrowserCacheManager:createKeyMaps - idToken with key: ${key} found, saving key to token key map`
                                    );
                                    const idTokenEntity =
                                        credObj as IdTokenEntity;
                                    const newKey =
                                        this.updateCredentialCacheKey(
                                            key,
                                            idTokenEntity,
                                            correlationId
                                        );
                                    this.addTokenKey(
                                        newKey,
                                        CredentialType.ID_TOKEN,
                                        correlationId
                                    );
                                    return;
                                } else {
                                    this.logger.trace(
                                        "BrowserCacheManager:createKeyMaps - key found matching idToken schema with value containing idToken credentialType field but value failed IdTokenEntity validation, skipping."
                                    );
                                    this.logger.tracePii(
                                        `BrowserCacheManager:createKeyMaps - failed idToken validation on key: ${key}`
                                    );
                                }
                                break;
                            case CredentialType.ACCESS_TOKEN:
                            case CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME:
                                if (CacheHelpers.isAccessTokenEntity(credObj)) {
                                    this.logger.trace(
                                        "BrowserCacheManager:createKeyMaps - accessToken found, saving key to token key map"
                                    );
                                    this.logger.tracePii(
                                        `BrowserCacheManager:createKeyMaps - accessToken with key: ${key} found, saving key to token key map`
                                    );
                                    const accessTokenEntity =
                                        credObj as AccessTokenEntity;
                                    const newKey =
                                        this.updateCredentialCacheKey(
                                            key,
                                            accessTokenEntity,
                                            correlationId
                                        );
                                    this.addTokenKey(
                                        newKey,
                                        CredentialType.ACCESS_TOKEN,
                                        correlationId
                                    );
                                    return;
                                } else {
                                    this.logger.trace(
                                        "BrowserCacheManager:createKeyMaps - key found matching accessToken schema with value containing accessToken credentialType field but value failed AccessTokenEntity validation, skipping."
                                    );
                                    this.logger.tracePii(
                                        `BrowserCacheManager:createKeyMaps - failed accessToken validation on key: ${key}`
                                    );
                                }
                                break;
                            case CredentialType.REFRESH_TOKEN:
                                if (
                                    CacheHelpers.isRefreshTokenEntity(credObj)
                                ) {
                                    this.logger.trace(
                                        "BrowserCacheManager:createKeyMaps - refreshToken found, saving key to token key map"
                                    );
                                    this.logger.tracePii(
                                        `BrowserCacheManager:createKeyMaps - refreshToken with key: ${key} found, saving key to token key map`
                                    );
                                    const refreshTokenEntity =
                                        credObj as RefreshTokenEntity;
                                    const newKey =
                                        this.updateCredentialCacheKey(
                                            key,
                                            refreshTokenEntity,
                                            correlationId
                                        );
                                    this.addTokenKey(
                                        newKey,
                                        CredentialType.REFRESH_TOKEN,
                                        correlationId
                                    );
                                    return;
                                } else {
                                    this.logger.trace(
                                        "BrowserCacheManager:createKeyMaps - key found matching refreshToken schema with value containing refreshToken credentialType field but value failed RefreshTokenEntity validation, skipping."
                                    );
                                    this.logger.tracePii(
                                        `BrowserCacheManager:createKeyMaps - failed refreshToken validation on key: ${key}`
                                    );
                                }
                                break;
                            default:
                            // If credentialType isn't one of our predefined ones, it may not be an MSAL cache value. Ignore.
                        }
                    }
                }
            }

            if (this.isAccountKey(key)) {
                const value = this.getItem(key);
                if (value) {
                    const accountObj = this.validateAndParseJson(value);
                    if (
                        accountObj &&
                        AccountEntity.isAccountEntity(accountObj)
                    ) {
                        this.logger.trace(
                            "BrowserCacheManager:createKeyMaps - account found, saving key to account key map"
                        );
                        this.logger.tracePii(
                            `BrowserCacheManager:createKeyMaps - account with key: ${key} found, saving key to account key map`
                        );
                        this.addAccountKeyToMap(key, correlationId);
                    }
                }
            }
        });
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
    setItem(key: string, value: string, correlationId: string): void {
        let accessTokenKeys: Array<string> = [];
        const maxRetries = 20;
        for (let i = 0; i <= maxRetries; i++) {
            try {
                this.browserStorage.setItem(key, value);
                if (i > 0) {
                    // Finally update the token keys array with the tokens removed
                    this.removeAccessTokenKeys(
                        accessTokenKeys.slice(0, i),
                        correlationId
                    );
                }
                break; // If setItem succeeds, exit the loop
            } catch (e) {
                const cacheError = createCacheError(e);
                if (
                    cacheError.errorCode ===
                        CacheErrorCodes.cacheQuotaExceeded &&
                    i < maxRetries
                ) {
                    if (!accessTokenKeys.length) {
                        if (
                            key ===
                            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`
                        ) {
                            // If we are currently trying to set the token keys, use the value we're trying to set
                            accessTokenKeys = (JSON.parse(value) as TokenKeys)
                                .accessToken;
                        } else {
                            // If token keys have not been initialized, get them
                            accessTokenKeys = this.getTokenKeys().accessToken;
                        }
                    }
                    if (accessTokenKeys.length <= i) {
                        // Nothing to remove, rethrow the error
                        throw cacheError;
                    }
                    // When cache quota is exceeded, start removing access tokens until we can successfully set the item
                    this.removeAccessToken(
                        accessTokenKeys[i],
                        correlationId,
                        false // Don't save token keys yet, do it at the end
                    );
                } else {
                    // If the error is not a quota exceeded error, rethrow it
                    throw cacheError;
                }
            }
        }
    }

    /**
     * fetch the account entity from the platform cache
     * @param accountKey
     */
    getAccount(
        accountKey: string,
        correlationId: string,
        logger?: Logger
    ): AccountEntity | null {
        this.logger.trace("BrowserCacheManager.getAccount called");
        const accountEntity = this.getCachedAccountEntity(
            accountKey,
            correlationId
        );

        return this.updateOutdatedCachedAccount(
            accountKey,
            accountEntity,
            correlationId,
            logger
        );
    }

    /**
     * Reads account from cache, deserializes it into an account entity and returns it.
     * If account is not found from the key, returns null and removes key from map.
     * @param accountKey
     * @returns
     */
    getCachedAccountEntity(
        accountKey: string,
        correlationId: string
    ): AccountEntity | null {
        const serializedAccount = this.getItem(accountKey);
        if (!serializedAccount) {
            this.removeAccountKeyFromMap(accountKey, correlationId);
            return null;
        }

        const parsedAccount = this.validateAndParseJson(serializedAccount);
        if (!parsedAccount || !AccountEntity.isAccountEntity(parsedAccount)) {
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
    setAccount(account: AccountEntity, correlationId: string): void {
        this.logger.trace("BrowserCacheManager.setAccount called");
        const key = account.generateAccountKey();
        account.lastUpdatedAt = Date.now().toString();
        this.setItem(key, JSON.stringify(account), correlationId);
        this.addAccountKeyToMap(key, correlationId);
    }

    /**
     * Returns the array of account keys currently cached
     * @returns
     */
    getAccountKeys(): Array<string> {
        this.logger.trace("BrowserCacheManager.getAccountKeys called");
        const accountKeys = this.getItem(StaticCacheKeys.ACCOUNT_KEYS);
        if (accountKeys) {
            return JSON.parse(accountKeys);
        }

        this.logger.verbose(
            "BrowserCacheManager.getAccountKeys - No account keys found"
        );
        return [];
    }

    /**
     * Add a new account to the key map
     * @param key
     */
    addAccountKeyToMap(key: string, correlationId: string): void {
        this.logger.trace("BrowserCacheManager.addAccountKeyToMap called");
        this.logger.tracePii(
            `BrowserCacheManager.addAccountKeyToMap called with key: ${key}`
        );
        const accountKeys = this.getAccountKeys();
        if (accountKeys.indexOf(key) === -1) {
            // Only add key if it does not already exist in the map
            accountKeys.push(key);
            this.setItem(
                StaticCacheKeys.ACCOUNT_KEYS,
                JSON.stringify(accountKeys),
                correlationId
            );
            this.logger.verbose(
                "BrowserCacheManager.addAccountKeyToMap account key added"
            );
        } else {
            this.logger.verbose(
                "BrowserCacheManager.addAccountKeyToMap account key already exists in map"
            );
        }
    }

    /**
     * Remove an account from the key map
     * @param key
     */
    removeAccountKeyFromMap(key: string, correlationId: string): void {
        this.logger.trace("BrowserCacheManager.removeAccountKeyFromMap called");
        this.logger.tracePii(
            `BrowserCacheManager.removeAccountKeyFromMap called with key: ${key}`
        );
        const accountKeys = this.getAccountKeys();
        const removalIndex = accountKeys.indexOf(key);
        if (removalIndex > -1) {
            accountKeys.splice(removalIndex, 1);
            if (accountKeys.length === 0) {
                // If no keys left, remove the map
                this.removeItem(StaticCacheKeys.ACCOUNT_KEYS);
                return;
            } else {
                this.setItem(
                    StaticCacheKeys.ACCOUNT_KEYS,
                    JSON.stringify(accountKeys),
                    correlationId
                );
            }
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
    async removeAccount(key: string, correlationId: string): Promise<void> {
        void super.removeAccount(key, correlationId);
        this.removeAccountKeyFromMap(key, correlationId);
    }

    /**
     * Remove account entity from the platform cache if it's outdated
     * @param accountKey
     */
    removeOutdatedAccount(accountKey: string, correlationId: string): void {
        this.removeItem(accountKey);
        this.removeAccountKeyFromMap(accountKey, correlationId);
    }

    /**
     * Removes given idToken from the cache and from the key map
     * @param key
     */
    removeIdToken(key: string, correlationId: string): void {
        super.removeIdToken(key, correlationId);
        this.removeTokenKey(key, CredentialType.ID_TOKEN, correlationId);
    }

    /**
     * Removes given accessToken from the cache and from the key map
     * @param key
     */
    removeAccessToken(
        key: string,
        correlationId: string,
        updateTokenKeys: boolean = true
    ): void {
        super.removeAccessToken(key, correlationId);
        this.performanceClient?.incrementFields(
            { accessTokensRemoved: 1 },
            correlationId
        );
        updateTokenKeys &&
            this.removeTokenKey(
                key,
                CredentialType.ACCESS_TOKEN,
                correlationId
            );
    }

    removeAccessTokenKeys(keys: Array<string>, correlationId: string): void {
        this.logger.trace("removeAccessTokenKey called");
        const tokenKeys = this.getTokenKeys();
        let keysRemoved = 0;
        keys.forEach((key) => {
            const accessRemoval = tokenKeys.accessToken.indexOf(key);
            if (accessRemoval > -1) {
                tokenKeys.accessToken.splice(accessRemoval, 1);
                keysRemoved++;
            }
        });

        if (keysRemoved > 0) {
            this.logger.info(
                `removed ${keysRemoved} accessToken keys from tokenKeys map`
            );
            this.setTokenKeys(tokenKeys, correlationId);
            return;
        }
    }

    /**
     * Removes given refreshToken from the cache and from the key map
     * @param key
     */
    removeRefreshToken(key: string, correlationId: string): void {
        super.removeRefreshToken(key, correlationId);
        this.removeTokenKey(key, CredentialType.REFRESH_TOKEN, correlationId);
    }

    /**
     * Gets the keys for the cached tokens associated with this clientId
     * @returns
     */
    getTokenKeys(): TokenKeys {
        this.logger.trace("BrowserCacheManager.getTokenKeys called");
        const item = this.getItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`
        );
        if (item) {
            const tokenKeys = this.validateAndParseJson(item);
            if (
                tokenKeys &&
                tokenKeys.hasOwnProperty("idToken") &&
                tokenKeys.hasOwnProperty("accessToken") &&
                tokenKeys.hasOwnProperty("refreshToken")
            ) {
                return tokenKeys as TokenKeys;
            } else {
                this.logger.error(
                    "BrowserCacheManager.getTokenKeys - Token keys found but in an unknown format. Returning empty key map."
                );
            }
        } else {
            this.logger.verbose(
                "BrowserCacheManager.getTokenKeys - No token keys found"
            );
        }

        return {
            idToken: [],
            accessToken: [],
            refreshToken: [],
        };
    }

    /**
     * Stores the token keys in the cache
     * @param tokenKeys
     * @param correlationId
     * @returns
     */
    setTokenKeys(tokenKeys: TokenKeys, correlationId: string): void {
        if (
            tokenKeys.idToken.length === 0 &&
            tokenKeys.accessToken.length === 0 &&
            tokenKeys.refreshToken.length === 0
        ) {
            // If no keys left, remove the map
            this.removeItem(`${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`);
            return;
        } else {
            this.setItem(
                `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
                JSON.stringify(tokenKeys),
                correlationId
            );
        }
    }

    /**
     * Adds the given key to the token key map
     * @param key
     * @param type
     */
    addTokenKey(
        key: string,
        type: CredentialType,
        correlationId: string
    ): void {
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
                const index = tokenKeys.accessToken.indexOf(key);
                if (index !== -1) {
                    tokenKeys.accessToken.splice(index, 1); // Remove existing key before pushing to the end
                }
                this.logger.trace(
                    `access token ${
                        index === -1 ? "added to" : "updated in"
                    } map`
                );
                tokenKeys.accessToken.push(key);
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

        this.setTokenKeys(tokenKeys, correlationId);
    }

    /**
     * Removes the given key from the token key map
     * @param key
     * @param type
     */
    removeTokenKey(
        key: string,
        type: CredentialType,
        correlationId: string,
        tokenKeys: TokenKeys = this.getTokenKeys()
    ): void {
        this.logger.trace("BrowserCacheManager removeTokenKey called");

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

        this.setTokenKeys(tokenKeys, correlationId);
    }

    /**
     * generates idToken entity from a string
     * @param idTokenKey
     */
    getIdTokenCredential(
        idTokenKey: string,
        correlationId: string
    ): IdTokenEntity | null {
        const value = this.getItem(idTokenKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getIdTokenCredential: called, no cache hit"
            );
            this.removeIdToken(idTokenKey, correlationId);
            return null;
        }

        const parsedIdToken = this.validateAndParseJson(value);
        if (!parsedIdToken || !CacheHelpers.isIdTokenEntity(parsedIdToken)) {
            this.logger.trace(
                "BrowserCacheManager.getIdTokenCredential: called, no cache hit"
            );
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
    setIdTokenCredential(idToken: IdTokenEntity, correlationId: string): void {
        this.logger.trace("BrowserCacheManager.setIdTokenCredential called");
        const idTokenKey = CacheHelpers.generateCredentialKey(idToken);
        idToken.lastUpdatedAt = Date.now().toString();

        this.setItem(idTokenKey, JSON.stringify(idToken), correlationId);

        this.addTokenKey(idTokenKey, CredentialType.ID_TOKEN, correlationId);
    }

    /**
     * generates accessToken entity from a string
     * @param key
     */
    getAccessTokenCredential(
        accessTokenKey: string,
        correlationId: string
    ): AccessTokenEntity | null {
        const value = this.getItem(accessTokenKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getAccessTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(
                accessTokenKey,
                CredentialType.ACCESS_TOKEN,
                correlationId
            );
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
    setAccessTokenCredential(
        accessToken: AccessTokenEntity,
        correlationId: string
    ): void {
        this.logger.trace(
            "BrowserCacheManager.setAccessTokenCredential called"
        );
        const accessTokenKey = CacheHelpers.generateCredentialKey(accessToken);
        accessToken.lastUpdatedAt = Date.now().toString();

        this.setItem(
            accessTokenKey,
            JSON.stringify(accessToken),
            correlationId
        );

        this.addTokenKey(
            accessTokenKey,
            CredentialType.ACCESS_TOKEN,
            correlationId
        );
    }

    /**
     * generates refreshToken entity from a string
     * @param refreshTokenKey
     */
    getRefreshTokenCredential(
        refreshTokenKey: string,
        correlationId: string
    ): RefreshTokenEntity | null {
        const value = this.getItem(refreshTokenKey);
        if (!value) {
            this.logger.trace(
                "BrowserCacheManager.getRefreshTokenCredential: called, no cache hit"
            );
            this.removeTokenKey(
                refreshTokenKey,
                CredentialType.REFRESH_TOKEN,
                correlationId
            );
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
    setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity,
        correlationId: string
    ): void {
        this.logger.trace(
            "BrowserCacheManager.setRefreshTokenCredential called"
        );
        const refreshTokenKey =
            CacheHelpers.generateCredentialKey(refreshToken);

        refreshToken.lastUpdatedAt = Date.now().toString();
        this.setItem(
            refreshTokenKey,
            JSON.stringify(refreshToken),
            correlationId
        );

        this.addTokenKey(
            refreshTokenKey,
            CredentialType.REFRESH_TOKEN,
            correlationId
        );
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    getAppMetadata(appMetadataKey: string): AppMetadataEntity | null {
        const value = this.getItem(appMetadataKey);
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
    setAppMetadata(
        appMetadata: AppMetadataEntity,
        correlationId: string
    ): void {
        this.logger.trace("BrowserCacheManager.setAppMetadata called");
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        this.setItem(
            appMetadataKey,
            JSON.stringify(appMetadata),
            correlationId
        );
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetryKey
     */
    getServerTelemetry(
        serverTelemetryKey: string
    ): ServerTelemetryEntity | null {
        const value = this.getItem(serverTelemetryKey);
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
        serverTelemetry: ServerTelemetryEntity,
        correlationId: string
    ): void {
        this.logger.trace("BrowserCacheManager.setServerTelemetry called");
        this.setItem(
            serverTelemetryKey,
            JSON.stringify(serverTelemetry),
            correlationId
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
    getActiveAccount(correlationId: string): AccountInfo | null {
        const activeAccountKeyFilters = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS
        );
        const activeAccountValueFilters = this.getItem(activeAccountKeyFilters);
        if (!activeAccountValueFilters) {
            // if new active account cache type isn't found, it's an old version, so look for that instead
            this.logger.trace(
                "BrowserCacheManager.getActiveAccount: No active account filters cache schema found, looking for legacy schema"
            );
            const activeAccountKeyLocal = this.generateCacheKey(
                PersistentCacheKeys.ACTIVE_ACCOUNT
            );
            const activeAccountValueLocal = this.getItem(activeAccountKeyLocal);
            if (!activeAccountValueLocal) {
                this.logger.trace(
                    "BrowserCacheManager.getActiveAccount: No active account found"
                );
                return null;
            }
            const activeAccount = this.getAccountInfoFilteredBy(
                {
                    localAccountId: activeAccountValueLocal,
                },
                correlationId
            );
            if (activeAccount) {
                this.logger.trace(
                    "BrowserCacheManager.getActiveAccount: Legacy active account cache schema found"
                );
                this.logger.trace(
                    "BrowserCacheManager.getActiveAccount: Adding active account filters cache schema"
                );
                this.setActiveAccount(activeAccount, correlationId);
                return activeAccount;
            }
            return null;
        }
        const activeAccountValueObj = this.validateAndParseJson(
            activeAccountValueFilters
        ) as AccountInfo;
        if (activeAccountValueObj) {
            this.logger.trace(
                "BrowserCacheManager.getActiveAccount: Active account filters schema found"
            );
            return this.getAccountInfoFilteredBy(
                {
                    homeAccountId: activeAccountValueObj.homeAccountId,
                    localAccountId: activeAccountValueObj.localAccountId,
                    tenantId: activeAccountValueObj.tenantId,
                },
                correlationId
            );
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
    setActiveAccount(account: AccountInfo | null, correlationId: string): void {
        const activeAccountKey = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT_FILTERS
        );
        const activeAccountKeyLocal = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT
        );
        if (account) {
            this.logger.verbose("setActiveAccount: Active account set");
            const activeAccountValue: ActiveAccountFilters = {
                homeAccountId: account.homeAccountId,
                localAccountId: account.localAccountId,
                tenantId: account.tenantId,
                lastUpdatedAt: Date.now().toString(),
            };
            this.setItem(
                activeAccountKey,
                JSON.stringify(activeAccountValue),
                correlationId
            );
            this.setItem(
                activeAccountKeyLocal,
                account.localAccountId,
                correlationId
            );
        } else {
            this.logger.verbose(
                "setActiveAccount: No account passed, active account not set"
            );
            this.browserStorage.removeItem(activeAccountKey);
            this.browserStorage.removeItem(activeAccountKeyLocal);
        }
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const value = this.getItem(throttlingCacheKey);
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
        throttlingCache: ThrottlingEntity,
        correlationId: string
    ): void {
        this.logger.trace("BrowserCacheManager.setThrottlingCache called");
        this.setItem(
            throttlingCacheKey,
            JSON.stringify(throttlingCache),
            correlationId
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
    async clear(correlationId: string): Promise<void> {
        // Removes all accounts and their credentials
        await this.removeAllAccounts(correlationId);
        this.removeAppMetadata(correlationId);

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

        let removedAccessTokens: number = 0;
        tokenKeys.accessToken.forEach((key: string) => {
            // if the access token has claims in its key, remove the token key and the token
            const credential = this.getAccessTokenCredential(
                key,
                correlationId
            );
            if (
                credential?.requestedClaimsHash &&
                key.includes(credential.requestedClaimsHash.toLowerCase())
            ) {
                this.removeAccessToken(key, correlationId);
                removedAccessTokens++;
            }
        });

        // warn if any access tokens are removed
        if (removedAccessTokens > 0) {
            this.logger.warning(
                `${removedAccessTokens} access tokens with claims in the cache keys have been removed from the cache.`
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
            if (
                StringUtils.startsWith(key, Constants.CACHE_PREFIX) ||
                StringUtils.startsWith(key, PersistentCacheKeys.ADAL_ID_TOKEN)
            ) {
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
            libraryState: { id: stateId },
        } = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString);

        return this.generateCacheKey(
            `${TemporaryCacheKeys.AUTHORITY}.${stateId}`
        );
    }

    /**
     * Create Nonce key to cache nonce
     * @param state
     */
    generateNonceKey(stateString: string): string {
        const {
            libraryState: { id: stateId },
        } = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString);

        return this.generateCacheKey(
            `${TemporaryCacheKeys.NONCE_IDTOKEN}.${stateId}`
        );
    }

    /**
     * Creates full cache key for the request state
     * @param stateString State string for the request
     */
    generateStateKey(stateString: string): string {
        // Use the library state id to key temp storage for uniqueness for multiple concurrent requests
        const {
            libraryState: { id: stateId },
        } = ProtocolUtils.parseRequestState(this.cryptoImpl, stateString);
        return this.generateCacheKey(
            `${TemporaryCacheKeys.REQUEST_STATE}.${stateId}`
        );
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
    updateCacheEntries(
        state: string,
        nonce: string,
        authorityInstance: string,
        loginHint: string,
        account: AccountInfo | null
    ): void {
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
                type: CcsCredentialType.HOME_ACCOUNT_ID,
            };
            this.setTemporaryCache(
                TemporaryCacheKeys.CCS_CREDENTIAL,
                JSON.stringify(ccsCredential),
                true
            );
        } else if (loginHint) {
            const ccsCredential: CcsCredential = {
                credential: loginHint,
                type: CcsCredentialType.UPN,
            };
            this.setTemporaryCache(
                TemporaryCacheKeys.CCS_CREDENTIAL,
                JSON.stringify(ccsCredential),
                true
            );
        }
    }

    /**
     * Reset all temporary cache items
     * @param state
     */
    resetRequestCache(state: string): void {
        this.logger.trace("BrowserCacheManager.resetRequestCache called");
        // check state and remove associated cache items
        if (state) {
            this.temporaryCacheStorage.getKeys().forEach((key) => {
                if (key.indexOf(state) !== -1) {
                    this.removeTemporaryItem(key);
                }
            });

            // delete generic interactive request parameters
            this.removeTemporaryItem(this.generateStateKey(state));
            this.removeTemporaryItem(this.generateNonceKey(state));
            this.removeTemporaryItem(this.generateAuthorityKey(state));
        }
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.URL_HASH)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.CORRELATION_ID)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.CCS_CREDENTIAL)
        );
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.NATIVE_REQUEST)
        );
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
            this.logger.infoPii(
                `BrowserCacheManager.cleanRequestByState: Removing temporary cache items for state: ${cachedState}`
            );
            this.resetRequestCache(cachedState || Constants.EMPTY_STRING);
        }
    }

    /**
     * Looks in temporary cache for any state values with the provided interactionType and removes all temporary cache items for that state
     * Used in scenarios where temp cache needs to be cleaned but state is not known, such as clicking browser back button.
     * @param interactionType
     */
    cleanRequestByInteractionType(interactionType: InteractionType): void {
        this.logger.trace(
            "BrowserCacheManager.cleanRequestByInteractionType called"
        );
        // Loop through all keys to find state key
        this.temporaryCacheStorage.getKeys().forEach((key) => {
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
            const parsedState = extractBrowserRequestState(
                this.cryptoImpl,
                stateValue
            );
            if (
                parsedState &&
                parsedState.interactionType === interactionType
            ) {
                this.logger.infoPii(
                    `BrowserCacheManager.cleanRequestByInteractionType: Removing temporary cache items for state: ${stateValue}`
                );
                this.resetRequestCache(stateValue);
            }
        });
        this.setInteractionInProgress(false);
    }

    cacheCodeRequest(authCodeRequest: CommonAuthorizationCodeRequest): void {
        this.logger.trace("BrowserCacheManager.cacheCodeRequest called");

        const encodedValue = base64Encode(JSON.stringify(authCodeRequest));
        this.setTemporaryCache(
            TemporaryCacheKeys.REQUEST_PARAMS,
            encodedValue,
            true
        );
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    getCachedRequest(state: string): CommonAuthorizationCodeRequest {
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

        let parsedRequest: CommonAuthorizationCodeRequest;
        try {
            parsedRequest = JSON.parse(base64Decode(encodedTokenRequest));
        } catch (e) {
            this.logger.errorPii(`Attempted to parse: ${encodedTokenRequest}`);
            this.logger.error(
                `Parsing cached token request threw with error: ${e}`
            );
            throw createBrowserAuthError(
                BrowserAuthErrorCodes.unableToParseTokenRequestCacheError
            );
        }
        this.removeTemporaryItem(
            this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS)
        );

        // Get cached authority and use if no authority is cached with request.
        if (!parsedRequest.authority) {
            const authorityCacheKey: string = this.generateAuthorityKey(state);
            const cachedAuthority = this.getTemporaryCache(authorityCacheKey);
            if (!cachedAuthority) {
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.noCachedAuthorityError
                );
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
                throw createBrowserAuthError(
                    BrowserAuthErrorCodes.interactionInProgress
                );
            } else {
                // No interaction is in progress
                this.setTemporaryCache(key, this.clientId, false);
            }
        } else if (
            !inProgress &&
            this.getInteractionInProgress() === this.clientId
        ) {
            this.removeTemporaryItem(key);
        }
    }

    /**
     * Returns username retrieved from ADAL or MSAL v1 idToken
     * @deprecated
     */
    getLegacyLoginHint(): string | null {
        // Only check for adal/msal token if no SSO params are being used
        const adalIdTokenString = this.getTemporaryCache(
            PersistentCacheKeys.ADAL_ID_TOKEN
        );
        if (adalIdTokenString) {
            this.browserStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
            this.logger.verbose("Cached ADAL id token retrieved.");
        }

        // Check for cached MSAL v1 id token
        const msalIdTokenString = this.getTemporaryCache(
            PersistentCacheKeys.ID_TOKEN,
            true
        );
        if (msalIdTokenString) {
            this.browserStorage.removeItem(
                this.generateCacheKey(PersistentCacheKeys.ID_TOKEN)
            );
            this.logger.verbose("Cached MSAL.js v1 id token retrieved");
        }

        const cachedIdTokenString = msalIdTokenString || adalIdTokenString;
        if (cachedIdTokenString) {
            const idTokenClaims = AuthToken.extractTokenClaims(
                cachedIdTokenString,
                base64Decode
            );
            if (idTokenClaims.preferred_username) {
                this.logger.verbose(
                    "No SSO params used and ADAL/MSAL v1 token retrieved, setting ADAL/MSAL v1 preferred_username as loginHint"
                );
                return idTokenClaims.preferred_username;
            } else if (idTokenClaims.upn) {
                this.logger.verbose(
                    "No SSO params used and ADAL/MSAL v1 token retrieved, setting ADAL/MSAL v1 upn as loginHint"
                );
                return idTokenClaims.upn;
            } else {
                this.logger.verbose(
                    "No SSO params used and ADAL/MSAL v1 token retrieved, however, no account hint claim found. Enable preferred_username or upn id token claim to get SSO."
                );
            }
        }

        return null;
    }

    /**
     * Updates a credential's cache key if the current cache key is outdated
     */
    updateCredentialCacheKey(
        currentCacheKey: string,
        credential: ValidCredentialType,
        correlationId: string
    ): string {
        const updatedCacheKey = CacheHelpers.generateCredentialKey(credential);

        if (currentCacheKey !== updatedCacheKey) {
            const cacheItem = this.getItem(currentCacheKey);
            if (cacheItem) {
                this.browserStorage.removeItem(currentCacheKey);
                this.setItem(updatedCacheKey, cacheItem, correlationId);
                this.logger.verbose(
                    `Updated an outdated ${credential.credentialType} cache key`
                );
                return updatedCacheKey;
            } else {
                this.logger.error(
                    `Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`
                );
            }
        }

        return currentCacheKey;
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
            result.expiresOn ? result.expiresOn.getTime() / 1000 : 0,
            result.extExpiresOn ? result.extExpiresOn.getTime() / 1000 : 0,
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

export const DEFAULT_BROWSER_CACHE_MANAGER = (
    clientId: string,
    logger: Logger
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
        logger
    );
};
