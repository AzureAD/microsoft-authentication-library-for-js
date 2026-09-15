/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    TokenKeys,
    AccountEntity,
    IdTokenEntity,
    AccessTokenEntity,
    RefreshTokenEntity,
    AppMetadataEntity,
    ServerTelemetryEntity,
    ThrottlingEntity,
    CacheManager,
    Logger,
    ValidCacheType,
    ICrypto,
    AuthorityMetadataEntity,
    ValidCredentialType,
    StaticAuthorityOptions,
    CacheHelpers,
    AccountEntityUtils,
    CredentialEntity,
    AccountInfo,
    StubPerformanceClient,
    DEFAULT_TOKEN_BINDING_KEY_MANAGER,
    TimeUtils,
} from "@azure/msal-common/node";

import { Deserializer } from "./serializer/Deserializer.js";
import { Serializer } from "./serializer/Serializer.js";
import {
    InMemoryCache,
    JsonCache,
    CacheKVStore,
} from "./serializer/SerializerTypes.js";
import { generateAccountKey, generateCredentialKey } from "./CacheHelpers.js";
import {
    InMemoryCacheOptions,
    validateInMemoryCacheOptions,
} from "../config/Configuration.js";

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 * @public
 */
export class NodeStorage extends CacheManager {
    // Cache configuration, either set by user or default values.
    private logger: Logger;
    private cache: CacheKVStore = {};
    private changeEmitters: Array<Function> = [];
    private readonly evictionEnabled: boolean;
    private readonly maxTokenEntries?: number;
    private writeSequence = 0;
    private tokenWriteOrder = new Map<string, number>();

    constructor(
        logger: Logger,
        clientId: string,
        cryptoImpl: ICrypto,
        staticAuthorityOptions?: StaticAuthorityOptions,
        inMemoryCacheOptions?: InMemoryCacheOptions
    ) {
        validateInMemoryCacheOptions(inMemoryCacheOptions);
        super(
            clientId,
            cryptoImpl,
            logger,
            new StubPerformanceClient(),
            staticAuthorityOptions,
            DEFAULT_TOKEN_BINDING_KEY_MANAGER
        );
        this.logger = logger;
        this.evictionEnabled = inMemoryCacheOptions?.evictionEnabled === true;
        this.maxTokenEntries = inMemoryCacheOptions?.maxEntries;
    }

    /**
     * Queue up callbacks
     * @param func - a callback function for cache change indication
     */
    registerChangeEmitter(func: () => void): void {
        this.changeEmitters.push(func);
    }

    /**
     * Invoke the callback when cache changes
     */
    emitChange(): void {
        this.changeEmitters.forEach((func) => func.call(null));
    }

    /**
     * Converts cacheKVStore to InMemoryCache
     * @param cache - key value store
     */
    cacheToInMemoryCache(cache: CacheKVStore): InMemoryCache {
        const inMemoryCache: InMemoryCache = {
            accounts: {},
            idTokens: {},
            accessTokens: {},
            refreshTokens: {},
            appMetadata: {},
        };

        for (const key in cache) {
            const value = cache[key];
            if (typeof value !== "object") {
                continue;
            }
            if (AccountEntityUtils.isAccountEntity(value)) {
                inMemoryCache.accounts[key] = value as AccountEntity;
            } else if (CacheHelpers.isIdTokenEntity(value)) {
                inMemoryCache.idTokens[key] = value as IdTokenEntity;
            } else if (CacheHelpers.isAccessTokenEntity(value)) {
                inMemoryCache.accessTokens[key] = value as AccessTokenEntity;
            } else if (CacheHelpers.isRefreshTokenEntity(value)) {
                inMemoryCache.refreshTokens[key] = value as RefreshTokenEntity;
            } else if (CacheHelpers.isAppMetadataEntity(key, value)) {
                inMemoryCache.appMetadata[key] = value as AppMetadataEntity;
            } else {
                continue;
            }
        }

        return inMemoryCache;
    }

    /**
     * converts inMemoryCache to CacheKVStore
     * @param inMemoryCache - kvstore map for inmemory
     */
    inMemoryCacheToCache(inMemoryCache: InMemoryCache): CacheKVStore {
        // convert in memory cache to a flat Key-Value map
        let cache = this.getCache();

        cache = {
            ...cache,
            ...inMemoryCache.accounts,
            ...inMemoryCache.idTokens,
            ...inMemoryCache.accessTokens,
            ...inMemoryCache.refreshTokens,
            ...inMemoryCache.appMetadata,
        };

        // convert in memory cache to a flat Key-Value map
        return cache;
    }

    /**
     * gets the current in memory cache for the client
     */
    getInMemoryCache(): InMemoryCache {
        this.logger.trace("Getting in-memory cache", "");

        // convert the cache key value store to inMemoryCache
        const inMemoryCache = this.cacheToInMemoryCache(this.cache);
        return inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache - key value map in memory
     */
    setInMemoryCache(inMemoryCache: InMemoryCache): void {
        this.logger.trace("Setting in-memory cache", "");

        const cache = this.evictionEnabled
            ? this.replaceSerializableCache(inMemoryCache)
            : this.inMemoryCacheToCache(inMemoryCache);
        this.setCache(cache);

        this.emitChange();
    }

    /**
     * get the current cache key-value store
     */
    getCache(): CacheKVStore {
        this.logger.trace("Getting cache key-value store", "");
        return this.evictionEnabled ? { ...this.cache } : this.cache;
    }

    /**
     * sets the current cache (key value store)
     * @param cacheMap - key value map
     */
    setCache(cache: CacheKVStore): void {
        this.logger.trace("Setting cache key value store", "");
        this.cache = this.evictionEnabled ? { ...cache } : cache;
        this.reconcileTokenWriteOrder();
        this.enforceTokenCacheBounds();

        // mark change in cache
        this.emitChange();
    }

    /**
     * Returns whether token-cache bounding is enabled.
     *
     * @internal
     */
    isCacheBounded(): boolean {
        return this.evictionEnabled;
    }

    /**
     * Gets cache item with given key.
     * @param key - lookup key for the cache entry
     */
    getItem(key: string): ValidCacheType {
        this.logger.tracePii(`Item key: ${key}`, "");

        return this.cache[key];
    }

    /**
     * Gets cache item with given key-value
     * @param key - lookup key for the cache entry
     * @param value - value of the cache entry
     */
    setItem(key: string, value: ValidCacheType): void {
        this.logger.tracePii(`Item key: ${key}`, "");

        if (!this.evictionEnabled) {
            const cache = this.getCache();
            cache[key] = value;
            this.setCache(cache);
            return;
        }

        this.cache[key] = value;
        if (this.isTokenCredential(value)) {
            this.recordTokenWrite(key);
            this.enforceTokenCacheBounds();
        }
        this.emitChange();
    }

    generateCredentialKey(
        credential: CredentialEntity,
        additionalCacheKeyHash?: string
    ): string {
        return generateCredentialKey(credential, additionalCacheKeyHash);
    }

    generateAccountKey(account: AccountInfo): string {
        return generateAccountKey(account);
    }

    getAccountKeys(): string[] {
        const inMemoryCache = this.getInMemoryCache();
        const accountKeys = Object.keys(inMemoryCache.accounts);

        return accountKeys;
    }

    getTokenKeys(): TokenKeys {
        const inMemoryCache = this.getInMemoryCache();
        const tokenKeys = {
            idToken: Object.keys(inMemoryCache.idTokens),
            accessToken: Object.keys(inMemoryCache.accessTokens),
            refreshToken: Object.keys(inMemoryCache.refreshTokens),
        };

        return tokenKeys;
    }

    /**
     * Reads account from cache, builds it into an account entity and returns it.
     * @param accountKey - lookup key to fetch cache type AccountEntity
     * @returns
     */
    getAccount(accountKey: string): AccountEntity | null {
        const cachedAccount = this.getItem(accountKey);
        return cachedAccount && typeof cachedAccount === "object"
            ? ({ ...cachedAccount } as AccountEntity)
            : null;
    }

    /**
     * set account entity
     * @param account - cache value to be set of type AccountEntity
     */
    async setAccount(account: AccountEntity): Promise<void> {
        const accountKey = this.generateAccountKey(
            AccountEntityUtils.getAccountInfo(account)
        );
        this.setItem(accountKey, account);
    }

    /**
     * fetch the idToken credential
     * @param idTokenKey - lookup key to fetch cache type IdTokenEntity
     */
    getIdTokenCredential(idTokenKey: string): IdTokenEntity | null {
        const idToken = this.getItem(idTokenKey) as IdTokenEntity;
        if (CacheHelpers.isIdTokenEntity(idToken)) {
            return idToken;
        }
        return null;
    }

    /**
     * set idToken credential
     * @param idToken - cache value to be set of type IdTokenEntity
     */
    async setIdTokenCredential(idToken: IdTokenEntity): Promise<void> {
        const idTokenKey = this.generateCredentialKey(idToken);
        this.setItem(idTokenKey, idToken);
    }

    /**
     * fetch the accessToken credential
     * @param accessTokenKey - lookup key to fetch cache type AccessTokenEntity
     */
    getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null {
        const accessToken = this.getItem(accessTokenKey) as AccessTokenEntity;
        if (CacheHelpers.isAccessTokenEntity(accessToken)) {
            return accessToken;
        }
        return null;
    }

    /**
     * Set accessToken credential to the cache
     * @param accessToken - the access token entity to cache
     * @param _correlationId - unique identifier for the request
     * @param _kmsi - keep me signed in flag
     * @param additionalCacheKeyHash - optional precomputed hash of additionalCacheKeyComponents used in key generation
     */
    async setAccessTokenCredential(
        accessToken: AccessTokenEntity,
        _correlationId: string,
        _kmsi: boolean,
        additionalCacheKeyHash?: string
    ): Promise<void> {
        const accessTokenKey = this.generateCredentialKey(
            accessToken,
            additionalCacheKeyHash
        );
        this.setItem(accessTokenKey, accessToken);
    }

    /**
     * fetch the refreshToken credential
     * @param refreshTokenKey - lookup key to fetch cache type RefreshTokenEntity
     */
    getRefreshTokenCredential(
        refreshTokenKey: string
    ): RefreshTokenEntity | null {
        const refreshToken = this.getItem(
            refreshTokenKey
        ) as RefreshTokenEntity;
        if (CacheHelpers.isRefreshTokenEntity(refreshToken)) {
            return refreshToken as RefreshTokenEntity;
        }
        return null;
    }

    /**
     * set refreshToken credential
     * @param refreshToken - cache value to be set of type RefreshTokenEntity
     */
    async setRefreshTokenCredential(
        refreshToken: RefreshTokenEntity
    ): Promise<void> {
        const refreshTokenKey = this.generateCredentialKey(refreshToken);
        this.setItem(refreshTokenKey, refreshToken);
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey - lookup key to fetch cache type AppMetadataEntity
     */
    getAppMetadata(appMetadataKey: string): AppMetadataEntity | null {
        const appMetadata: AppMetadataEntity = this.getItem(
            appMetadataKey
        ) as AppMetadataEntity;
        if (CacheHelpers.isAppMetadataEntity(appMetadataKey, appMetadata)) {
            return appMetadata;
        }
        return null;
    }

    /**
     * set appMetadata entity to the platform cache
     * @param appMetadata - cache value to be set of type AppMetadataEntity
     */
    setAppMetadata(appMetadata: AppMetadataEntity): void {
        const appMetadataKey = CacheHelpers.generateAppMetadataKey(appMetadata);
        this.setItem(appMetadataKey, appMetadata);
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetrykey - lookup key to fetch cache type ServerTelemetryEntity
     */
    getServerTelemetry(
        serverTelemetrykey: string
    ): ServerTelemetryEntity | null {
        const serverTelemetryEntity: ServerTelemetryEntity = this.getItem(
            serverTelemetrykey
        ) as ServerTelemetryEntity;
        if (
            serverTelemetryEntity &&
            CacheHelpers.isServerTelemetryEntity(
                serverTelemetrykey,
                serverTelemetryEntity
            )
        ) {
            return serverTelemetryEntity;
        }
        return null;
    }

    /**
     * set server telemetry entity to the platform cache
     * @param serverTelemetryKey - lookup key to fetch cache type ServerTelemetryEntity
     * @param serverTelemetry - cache value to be set of type ServerTelemetryEntity
     */
    setServerTelemetry(
        serverTelemetryKey: string,
        serverTelemetry: ServerTelemetryEntity
    ): void {
        this.setItem(serverTelemetryKey, serverTelemetry);
    }

    /**
     * fetch authority metadata entity from the platform cache
     * @param key - lookup key to fetch cache type AuthorityMetadataEntity
     */
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        const authorityMetadataEntity: AuthorityMetadataEntity = this.getItem(
            key
        ) as AuthorityMetadataEntity;
        if (
            authorityMetadataEntity &&
            CacheHelpers.isAuthorityMetadataEntity(key, authorityMetadataEntity)
        ) {
            return authorityMetadataEntity;
        }
        return null;
    }

    /**
     * Get all authority metadata keys
     */
    getAuthorityMetadataKeys(): Array<string> {
        return this.getKeys().filter((key) => {
            return this.isAuthorityMetadata(key);
        });
    }

    /**
     * set authority metadata entity to the platform cache
     * @param key - lookup key to fetch cache type AuthorityMetadataEntity
     * @param metadata - cache value to be set of type AuthorityMetadataEntity
     */
    setAuthorityMetadata(key: string, metadata: AuthorityMetadataEntity): void {
        this.setItem(key, metadata);
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey - lookup key to fetch cache type ThrottlingEntity
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const throttlingCache: ThrottlingEntity = this.getItem(
            throttlingCacheKey
        ) as ThrottlingEntity;
        if (
            throttlingCache &&
            CacheHelpers.isThrottlingEntity(throttlingCacheKey, throttlingCache)
        ) {
            return throttlingCache;
        }
        return null;
    }

    /**
     * set throttling entity to the platform cache
     * @param throttlingCacheKey - lookup key to fetch cache type ThrottlingEntity
     * @param throttlingCache - cache value to be set of type ThrottlingEntity
     */
    setThrottlingCache(
        throttlingCacheKey: string,
        throttlingCache: ThrottlingEntity
    ): void {
        this.setItem(throttlingCacheKey, throttlingCache);
    }

    /**
     * Removes the cache item from memory with the given key.
     * @param key - lookup key to remove a cache entity
     * @param inMemory - key value map of the cache
     */
    removeItem(key: string): boolean {
        this.logger.tracePii(`Item key: ${key}`, "");

        if (!this.evictionEnabled) {
            let result = false;
            const cache = this.getCache();
            if (cache[key]) {
                delete cache[key];
                result = true;
            }
            if (result) {
                this.setCache(cache);
                this.emitChange();
            }
            return result;
        }

        if (this.cache[key]) {
            delete this.cache[key];
            this.tokenWriteOrder.delete(key);
            this.emitChange();
            return true;
        }

        return false;
    }

    /**
     * Remove account entity from the platform cache if it's outdated
     * @param accountKey - lookup key to fetch cache type AccountEntity
     */
    removeOutdatedAccount(accountKey: string): void {
        this.removeItem(accountKey);
    }

    /**
     * Checks whether key is in cache.
     * @param key - look up key for a cache entity
     */
    containsKey(key: string): boolean {
        return this.getKeys().includes(key);
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        this.logger.trace("Retrieving all cache keys", "");

        return [...Object.keys(this.cache)];
    }

    /**
     * Clears all cache entries created by MSAL except authority metadata..
     */
    clear(): void {
        this.logger.trace("Clearing cache entries created by MSAL", "");

        // read inMemoryCache
        const cacheKeys = this.getKeys();

        // delete each element
        cacheKeys.forEach((key) => {
            if (this.isAuthorityMetadata(key)) {
                return;
            }
            this.removeItem(key);
        });
        this.tokenWriteOrder.clear();
        this.writeSequence = 0;
        this.emitChange();
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     * @param cache - blob formatted cache (JSON)
     */
    static generateInMemoryCache(cache: string): InMemoryCache {
        return Deserializer.deserializeAllCache(
            Deserializer.deserializeJSONBlob(cache)
        );
    }

    /**
     * retrieves the final JSON
     * @param inMemoryCache - itemised cache read from the JSON
     */
    static generateJsonCache(inMemoryCache: InMemoryCache): JsonCache {
        return Serializer.serializeAllCache(inMemoryCache);
    }

    /**
     * Updates a credential's cache key if the current cache key is outdated
     */
    updateCredentialCacheKey(
        currentCacheKey: string,
        credential: ValidCredentialType
    ): string {
        const updatedCacheKey = this.generateCredentialKey(credential);

        if (currentCacheKey !== updatedCacheKey) {
            const cacheItem = this.getItem(currentCacheKey);
            if (cacheItem) {
                this.removeItem(currentCacheKey);
                this.setItem(updatedCacheKey, cacheItem);
                this.logger.verbose(
                    `Updated an outdated ${credential.credentialType} cache key`,
                    ""
                );
                return updatedCacheKey;
            } else {
                this.logger.error(
                    `Attempted to update an outdated ${credential.credentialType} cache key but no item matching the outdated key was found in storage`,
                    ""
                );
            }
        }

        return currentCacheKey;
    }

    private isTokenCredential(
        value: ValidCacheType
    ): value is IdTokenEntity | AccessTokenEntity | RefreshTokenEntity {
        if (typeof value !== "object") {
            return false;
        }

        return (
            CacheHelpers.isIdTokenEntity(value) ||
            CacheHelpers.isAccessTokenEntity(value) ||
            CacheHelpers.isRefreshTokenEntity(value)
        );
    }

    private recordTokenWrite(key: string): void {
        if (!this.evictionEnabled) {
            return;
        }

        if (this.writeSequence >= Number.MAX_SAFE_INTEGER) {
            this.compactTokenWriteOrder();
        }
        this.writeSequence += 1;
        this.tokenWriteOrder.set(key, this.writeSequence);
    }

    private compactTokenWriteOrder(): void {
        const entries = Array.from(this.tokenWriteOrder.entries()).sort(
            ([firstKey, firstOrder], [secondKey, secondOrder]) =>
                firstOrder - secondOrder ||
                firstKey.localeCompare(secondKey)
        );
        this.writeSequence = 0;
        entries.forEach(([key]) => {
            this.writeSequence += 1;
            this.tokenWriteOrder.set(key, this.writeSequence);
        });
    }

    private reconcileTokenWriteOrder(): void {
        const nextWriteOrder = new Map<string, number>();
        this.writeSequence = 0;
        if (!this.evictionEnabled) {
            this.tokenWriteOrder = nextWriteOrder;
            return;
        }

        Object.entries(this.cache).forEach(([key, value]) => {
            if (this.isTokenCredential(value)) {
                this.writeSequence += 1;
                nextWriteOrder.set(key, this.writeSequence);
            }
        });
        this.tokenWriteOrder = nextWriteOrder;
    }

    private replaceSerializableCache(
        inMemoryCache: InMemoryCache
    ): CacheKVStore {
        const preservedCacheEntries = Object.fromEntries(
            Object.entries(this.cache).filter(([key, value]) => {
                if (typeof value !== "object") {
                    return true;
                }

                return (
                    !AccountEntityUtils.isAccountEntity(value) &&
                    !this.isTokenCredential(value) &&
                    !CacheHelpers.isAppMetadataEntity(key, value)
                );
            })
        );

        return {
            ...preservedCacheEntries,
            ...inMemoryCache.accounts,
            ...inMemoryCache.idTokens,
            ...inMemoryCache.accessTokens,
            ...inMemoryCache.refreshTokens,
            ...inMemoryCache.appMetadata,
        };
    }

    private enforceTokenCacheBounds(): void {
        if (!this.evictionEnabled || this.maxTokenEntries === undefined) {
            return;
        }

        const evictedTokens: Array<
            IdTokenEntity | AccessTokenEntity | RefreshTokenEntity
        > = [];
        let expiredCount = 0;
        this.getTokenEntries().forEach(([key, token]) => {
            if (this.isTokenExpired(token)) {
                this.evictToken(key, token);
                evictedTokens.push(token);
                expiredCount += 1;
            }
        });

        let capacityCount = 0;
        const remainingTokens = this.getTokenEntries();
        const excessCount = remainingTokens.length - this.maxTokenEntries;
        if (excessCount > 0) {
            remainingTokens
                .sort(([firstKey], [secondKey]) => {
                    const orderDifference =
                        (this.tokenWriteOrder.get(firstKey) ?? 0) -
                        (this.tokenWriteOrder.get(secondKey) ?? 0);
                    return orderDifference || firstKey.localeCompare(secondKey);
                })
                .slice(0, excessCount)
                .forEach(([key, token]) => {
                    this.evictToken(key, token);
                    evictedTokens.push(token);
                    capacityCount += 1;
                });
        }

        if (evictedTokens.length > 0) {
            this.removeOrphanedAccounts(evictedTokens);
        }
        if (expiredCount > 0) {
            this.logger.verbose(
                `NodeStorage pruned ${expiredCount} expired token cache entries.`,
                ""
            );
        }
        if (capacityCount > 0) {
            this.logger.verbose(
                `NodeStorage evicted ${capacityCount} oldest token cache entries to enforce the configured capacity.`,
                ""
            );
        }
    }

    private getTokenEntries(): Array<
        [string, IdTokenEntity | AccessTokenEntity | RefreshTokenEntity]
    > {
        return Object.entries(this.cache).filter(
            (
                entry
            ): entry is [
                string,
                IdTokenEntity | AccessTokenEntity | RefreshTokenEntity
            ] => this.isTokenCredential(entry[1])
        );
    }

    private isTokenExpired(
        token: IdTokenEntity | AccessTokenEntity | RefreshTokenEntity
    ): boolean {
        if (CacheHelpers.isAccessTokenEntity(token)) {
            return (
                TimeUtils.wasClockTurnedBack(token.cachedAt) ||
                TimeUtils.isTokenExpired(token.expiresOn, 0)
            );
        }

        return (
            CacheHelpers.isRefreshTokenEntity(token) &&
            !!token.expiresOn &&
            TimeUtils.isTokenExpired(token.expiresOn, 0)
        );
    }

    private evictToken(
        key: string,
        token: IdTokenEntity | AccessTokenEntity | RefreshTokenEntity
    ): void {
        if (CacheHelpers.isAccessTokenEntity(token)) {
            this.removeAccessToken(key, "");
        } else if (CacheHelpers.isIdTokenEntity(token)) {
            this.removeIdToken(key, "");
        } else {
            this.removeRefreshToken(key, "");
        }
    }

    private removeOrphanedAccounts(
        evictedTokens: Array<
            IdTokenEntity | AccessTokenEntity | RefreshTokenEntity
        >
    ): void {
        const evictedAccountPartitions = new Set(
            evictedTokens
                .filter((token) => !!token.homeAccountId)
                .map((token) => this.getAccountPartition(token))
        );
        if (evictedAccountPartitions.size === 0) {
            return;
        }

        const remainingAccountPartitions = new Set(
            this.getTokenEntries()
                .map(([, token]) => token)
                .filter((token) => !!token.homeAccountId)
                .map((token) => this.getAccountPartition(token))
        );
        let orphanCount = 0;

        Object.entries(this.cache).forEach(([key, value]) => {
            if (
                typeof value === "object" &&
                AccountEntityUtils.isAccountEntity(value) &&
                evictedAccountPartitions.has(this.getAccountPartition(value)) &&
                !remainingAccountPartitions.has(
                    this.getAccountPartition(value)
                )
            ) {
                if (this.removeItem(key)) {
                    orphanCount += 1;
                }
            }
        });

        if (orphanCount > 0) {
            this.logger.verbose(
                `NodeStorage removed ${orphanCount} orphaned account cache entries after token eviction.`,
                ""
            );
        }
    }

    private getAccountPartition(entity: {
        homeAccountId: string;
        environment: string;
    }): string {
        return `${entity.homeAccountId.toLowerCase()}|${entity.environment.toLowerCase()}`;
    }
}
