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
} from "@azure/msal-common";
import { CacheOptions } from "../config/Configuration";
import {
    createBrowserAuthError,
    BrowserAuthErrorCodes,
} from "../error/BrowserAuthError";
import {
    BrowserCacheLocation,
    InteractionType,
    TemporaryCacheKeys,
    InMemoryCacheKeys,
    StaticCacheKeys,
} from "../utils/BrowserConstants";
import { BrowserStorage } from "./BrowserStorage";
import { MemoryStorage } from "./MemoryStorage";
import { IWindowStorage } from "./IWindowStorage";
import { extractBrowserRequestState } from "../utils/BrowserProtocolUtils";
import { NativeTokenRequest } from "../broker/nativeBroker/NativeRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { base64Decode } from "../encode/Base64Decode";
import { base64Encode } from "../encode/Base64Encode";

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
    // Logger instance
    protected logger: Logger;

    // Cookie life calculation (hours * minutes * seconds * ms)
    protected readonly COOKIE_LIFE_MULTIPLIER = 24 * 60 * 60 * 1000;

    constructor(
        clientId: string,
        cacheConfig: Required<CacheOptions>,
        cryptoImpl: ICrypto,
        logger: Logger,
        staticAuthorityOptions?: StaticAuthorityOptions
    ) {
        super(clientId, cryptoImpl, logger, staticAuthorityOptions);
        this.cacheConfig = cacheConfig;
        this.logger = logger;
        this.internalStorage = new MemoryStorage();
        this.browserStorage = this.setupBrowserStorage(
            this.cacheConfig.cacheLocation
        );
        this.temporaryCacheStorage = this.setupTemporaryCacheStorage(
            this.cacheConfig.temporaryCacheLocation,
            this.cacheConfig.cacheLocation
        );

        // Migrate cache entries from older versions of MSAL.
        if (cacheConfig.cacheMigrationEnabled) {
            this.migrateCacheEntries();
            this.createKeyMaps();
        }
    }

    /**
     * Returns a window storage class implementing the IWindowStorage interface that corresponds to the configured cacheLocation.
     * @param cacheLocation
     */
    protected setupBrowserStorage(
        cacheLocation: BrowserCacheLocation | string
    ): IWindowStorage<string> {
        switch (cacheLocation) {
            case BrowserCacheLocation.LocalStorage:
            case BrowserCacheLocation.SessionStorage:
                try {
                    return new BrowserStorage(cacheLocation);
                } catch (e) {
                    this.logger.verbose(e as string);
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
     * Returns a window storage class implementing the IWindowStorage interface that corresponds to the configured temporaryCacheLocation.
     * @param temporaryCacheLocation
     * @param cacheLocation
     */
    protected setupTemporaryCacheStorage(
        temporaryCacheLocation: BrowserCacheLocation | string,
        cacheLocation: BrowserCacheLocation | string
    ): IWindowStorage<string> {
        switch (cacheLocation) {
            case BrowserCacheLocation.LocalStorage:
            case BrowserCacheLocation.SessionStorage:
                try {
                    // Temporary cache items will always be stored in session storage to mitigate problems caused by multiple tabs
                    return new BrowserStorage(
                        temporaryCacheLocation ||
                            BrowserCacheLocation.SessionStorage
                    );
                } catch (e) {
                    this.logger.verbose(e as string);
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

        keysToMigrate.forEach((cacheKey: string, index: number) =>
            this.migrateCacheEntry(cacheKey, values[index])
        );
    }

    /**
     * Utility function to help with migration.
     * @param newKey
     * @param value
     * @param storeAuthStateInCookie
     */
    protected migrateCacheEntry(newKey: string, value: string | null): void {
        if (value) {
            this.setTemporaryCache(newKey, value, true);
        }
    }

    /**
     * Searches all cache entries for MSAL accounts and creates the account key map
     * This is used to migrate users from older versions of MSAL which did not create the map.
     * @returns
     */
    private createKeyMaps(): void {
        this.logger.trace("BrowserCacheManager - createKeyMaps called.");
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
                                            idTokenEntity
                                        );
                                    this.addTokenKey(
                                        newKey,
                                        CredentialType.ID_TOKEN
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
                                            accessTokenEntity
                                        );
                                    this.addTokenKey(
                                        newKey,
                                        CredentialType.ACCESS_TOKEN
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
                                            refreshTokenEntity
                                        );
                                    this.addTokenKey(
                                        newKey,
                                        CredentialType.REFRESH_TOKEN
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
                        this.addAccountKeyToMap(key);
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
    setItem(key: string, value: string): void {
        this.browserStorage.setItem(key, value);
    }

    /**
     * fetch the account entity from the platform cache
     * @param accountKey
     */
    getAccount(accountKey: string, logger?: Logger): AccountEntity | null {
        this.logger.trace("BrowserCacheManager.getAccount called");
        const accountEntity = this.getCachedAccountEntity(accountKey);

        return this.updateOutdatedCachedAccount(
            accountKey,
            accountEntity,
            logger
        );
    }

    /**
     * Reads account from cache, deserializes it into an account entity and returns it.
     * If account is not found from the key, returns null and removes key from map.
     * @param accountKey
     * @returns
     */
    getCachedAccountEntity(accountKey: string): AccountEntity | null {
        const serializedAccount = this.getItem(accountKey);
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
    setAccount(account: AccountEntity): void {
        this.logger.trace("BrowserCacheManager.setAccount called");
        const key = account.generateAccountKey();
        this.setItem(key, JSON.stringify(account));
        this.addAccountKeyToMap(key);
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
    addAccountKeyToMap(key: string): void {
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
                JSON.stringify(accountKeys)
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
    removeAccountKeyFromMap(key: string): void {
        this.logger.trace("BrowserCacheManager.removeAccountKeyFromMap called");
        this.logger.tracePii(
            `BrowserCacheManager.removeAccountKeyFromMap called with key: ${key}`
        );
        const accountKeys = this.getAccountKeys();
        const removalIndex = accountKeys.indexOf(key);
        if (removalIndex > -1) {
            accountKeys.splice(removalIndex, 1);
            this.setItem(
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
     * Remove account entity from the platform cache if it's outdated
     * @param accountKey
     */
    removeOutdatedAccount(accountKey: string): void {
        this.removeItem(accountKey);
        this.removeAccountKeyFromMap(accountKey);
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

        this.setItem(
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

        this.setItem(
            `${StaticCacheKeys.TOKEN_KEYS}.${this.clientId}`,
            JSON.stringify(tokenKeys)
        );
    }

    /**
     * generates idToken entity from a string
     * @param idTokenKey
     */
    getIdTokenCredential(idTokenKey: string): IdTokenEntity | null {
        const value = this.getItem(idTokenKey);
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
    setIdTokenCredential(idToken: IdTokenEntity): void {
        this.logger.trace("BrowserCacheManager.setIdTokenCredential called");
        const idTokenKey = CacheHelpers.generateCredentialKey(idToken);

        this.setItem(idTokenKey, JSON.stringify(idToken));

        this.addTokenKey(idTokenKey, CredentialType.ID_TOKEN);
    }

    /**
     * generates accessToken entity from a string
     * @param key
     */
    getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null {
        const value = this.getItem(accessTokenKey);
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
    setAccessTokenCredential(accessToken: AccessTokenEntity): void {
        this.logger.trace(
            "BrowserCacheManager.setAccessTokenCredential called"
        );
        const accessTokenKey = CacheHelpers.generateCredentialKey(accessToken);
        this.setItem(accessTokenKey, JSON.stringify(accessToken));

        this.addTokenKey(accessTokenKey, CredentialType.ACCESS_TOKEN);
    }

    /**
     * generates refreshToken entity from a string
     * @param refreshTokenKey
     */
    getRefreshTokenCredential(
        refreshTokenKey: string
    ): RefreshTokenEntity | null {
        const value = this.getItem(refreshTokenKey);
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
    setRefreshTokenCredential(refreshToken: RefreshTokenEntity): void {
        this.logger.trace(
            "BrowserCacheManager.setRefreshTokenCredential called"
        );
        const refreshTokenKey =
            CacheHelpers.generateCredentialKey(refreshToken);
        this.setItem(refreshTokenKey, JSON.stringify(refreshToken));

        this.addTokenKey(refreshTokenKey, CredentialType.REFRESH_TOKEN);
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
    setAppMetadata(appMetadata: AppMetadataEntity): void {
        this.logger.trace("BrowserCacheManager.setAppMetadata called");
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        this.setItem(appMetadataKey, JSON.stringify(appMetadata));
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
        serverTelemetry: ServerTelemetryEntity
    ): void {
        this.logger.trace("BrowserCacheManager.setServerTelemetry called");
        this.setItem(serverTelemetryKey, JSON.stringify(serverTelemetry));
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
            const activeAccount = this.getAccountInfoFilteredBy({
                localAccountId: activeAccountValueLocal,
            });
            if (activeAccount) {
                this.logger.trace(
                    "BrowserCacheManager.getActiveAccount: Legacy active account cache schema found"
                );
                this.logger.trace(
                    "BrowserCacheManager.getActiveAccount: Adding active account filters cache schema"
                );
                this.setActiveAccount(activeAccount);
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
        const activeAccountKeyLocal = this.generateCacheKey(
            PersistentCacheKeys.ACTIVE_ACCOUNT
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
            this.browserStorage.setItem(
                activeAccountKeyLocal,
                account.localAccountId
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
        throttlingCache: ThrottlingEntity
    ): void {
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
            this.setItemCookie(key, value);
        }
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    removeItem(key: string): void {
        this.browserStorage.removeItem(key);
        this.temporaryCacheStorage.removeItem(key);
        if (this.cacheConfig.storeAuthStateInCookie) {
            this.logger.trace(
                "BrowserCacheManager.removeItem: storeAuthStateInCookie is true, clearing item cookie"
            );
            this.clearItemCookie(key);
        }
    }

    /**
     * Checks whether key is in cache.
     * @param key
     */
    containsKey(key: string): boolean {
        return (
            this.browserStorage.containsKey(key) ||
            this.temporaryCacheStorage.containsKey(key)
        );
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        return [
            ...this.browserStorage.getKeys(),
            ...this.temporaryCacheStorage.getKeys(),
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
            if (
                (this.browserStorage.containsKey(cacheKey) ||
                    this.temporaryCacheStorage.containsKey(cacheKey)) &&
                (cacheKey.indexOf(Constants.CACHE_PREFIX) !== -1 ||
                    cacheKey.indexOf(this.clientId) !== -1)
            ) {
                this.removeItem(cacheKey);
            }
        });

        this.internalStorage.clear();
    }

    /**
     * Clears all access tokes that have claims prior to saving the current one
     * @param performanceClient {IPerformanceClient}
     * @returns
     */
    async clearTokensAndKeysWithClaims(
        performanceClient: IPerformanceClient
    ): Promise<void> {
        performanceClient.addQueueMeasurement(
            PerformanceEvents.ClearTokensAndKeysWithClaims
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
        let cookieStr = `${encodeURIComponent(cookieName)}=${encodeURIComponent(
            cookieValue
        )};path=/;SameSite=Lax;`;
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
                return decodeURIComponent(
                    cookie.substring(name.length, cookie.length)
                );
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
        const expr = new Date(
            today.getTime() + cookieLifeDays * this.COOKIE_LIFE_MULTIPLIER
        );
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
            this.getKeys().forEach((key) => {
                if (key.indexOf(state) !== -1) {
                    this.removeItem(key);
                }
            });

            // delete generic interactive request parameters
            this.removeItem(this.generateStateKey(state));
            this.removeItem(this.generateNonceKey(state));
            this.removeItem(this.generateAuthorityKey(state));
        }
        this.removeItem(
            this.generateCacheKey(TemporaryCacheKeys.REQUEST_PARAMS)
        );
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.ORIGIN_URI));
        this.removeItem(this.generateCacheKey(TemporaryCacheKeys.URL_HASH));
        this.removeItem(
            this.generateCacheKey(TemporaryCacheKeys.CORRELATION_ID)
        );
        this.removeItem(
            this.generateCacheKey(TemporaryCacheKeys.CCS_CREDENTIAL)
        );
        this.removeItem(
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
        this.clearMsalCookies();
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
        this.clearMsalCookies();
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
        this.removeItem(
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
            this.removeItem(key);
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
            this.removeItem(
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
        credential: ValidCredentialType
    ): string {
        const updatedCacheKey = CacheHelpers.generateCredentialKey(credential);

        if (currentCacheKey !== updatedCacheKey) {
            const cacheItem = this.getItem(currentCacheKey);
            if (cacheItem) {
                this.removeItem(currentCacheKey);
                this.setItem(updatedCacheKey, cacheItem);
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
     * Returns application id as redirect context during AcquireTokenRedirect flow.
     */
    getRedirectRequestContext(): string | null {
        return this.getTemporaryCache(
            TemporaryCacheKeys.REDIRECT_CONTEXT,
            true
        );
    }

    /**
     * Sets application id as the redirect context during AcquireTokenRedirect flow.
     * @param value
     */
    setRedirectRequestContext(value: string): void {
        this.setTemporaryCache(
            TemporaryCacheKeys.REDIRECT_CONTEXT,
            value,
            true
        );
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
        const accessTokenEntity = CacheHelpers.createAccessTokenEntity(
            result.account?.homeAccountId,
            result.account.environment,
            result.accessToken,
            this.clientId,
            result.tenantId,
            result.scopes.join(" "),
            result.expiresOn?.getTime() || 0,
            result.extExpiresOn?.getTime() || 0,
            base64Decode,
            undefined, // refreshOn
            result.tokenType as AuthenticationScheme,
            undefined, // userAssertionHash
            request.sshKid,
            request.claims,
            claimsHash
        );

        const cacheRecord = new CacheRecord(
            undefined,
            idTokenEntity,
            accessTokenEntity
        );
        return this.saveCacheRecord(cacheRecord);
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
