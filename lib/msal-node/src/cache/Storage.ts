/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
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
    AuthorityMetadataEntity
} from "@azure/msal-common";
import { Deserializer } from "./serializer/Deserializer";
import { Serializer } from "./serializer/Serializer";
import { InMemoryCache, JsonCache, CacheKVStore } from "./serializer/SerializerTypes";

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage extends CacheManager {
    // Cache configuration, either set by user or default values.
    private logger: Logger;
    private cache: CacheKVStore = {};
    private changeEmitters: Array<Function> = [];

    constructor(logger: Logger, clientId: string, cryptoImpl: ICrypto) {
        super(clientId, cryptoImpl);
        this.logger = logger;
    }

    registerChangeEmitter(func: () => void): void {
        this.changeEmitters.push(func);
    }

    emitChange(): void {
        this.changeEmitters.forEach(func => func.call(null));
    }

    /**
     * Converts cacheKVStore to InMemoryCache
     * @param cache
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
            if (cache[key as string] instanceof AccountEntity) {
                inMemoryCache.accounts[key] = cache[key] as AccountEntity;
            } else if (cache[key] instanceof IdTokenEntity) {
                inMemoryCache.idTokens[key] = cache[key] as IdTokenEntity;
            } else if (cache[key] instanceof AccessTokenEntity) {
                inMemoryCache.accessTokens[key] = cache[key] as AccessTokenEntity;
            } else if (cache[key] instanceof RefreshTokenEntity) {
                inMemoryCache.refreshTokens[key] = cache[key] as RefreshTokenEntity;
            } else if (cache[key] instanceof AppMetadataEntity) {
                inMemoryCache.appMetadata[key] = cache[key] as AppMetadataEntity;
            } else {
                continue;
            }
        }

        return inMemoryCache;
    }

    /**
     * converts inMemoryCache to CacheKVStore
     * @param inMemoryCache
     */
    inMemoryCacheToCache(inMemoryCache: InMemoryCache): CacheKVStore {
        // convert in memory cache to a flat Key-Value map
        let cache = this.getCache();

        cache = {
            ...inMemoryCache.accounts,
            ...inMemoryCache.idTokens,
            ...inMemoryCache.accessTokens,
            ...inMemoryCache.refreshTokens,
            ...inMemoryCache.appMetadata
        };
        return cache;
    }

    /**
     * gets the current in memory cache for the client
     */
    getInMemoryCache(): InMemoryCache {
        this.logger.verbose("Getting in-memory cache");

        // convert the cache key value store to inMemoryCache
        const inMemoryCache = this.cacheToInMemoryCache(this.getCache());
        return inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache
     */
    setInMemoryCache(inMemoryCache: InMemoryCache): void{
        this.logger.verbose("Setting in-memory cache");

        // convert and append the inMemoryCache to cacheKVStore
        const cache = this.inMemoryCacheToCache(inMemoryCache);
        this.setCache(cache);

        this.emitChange();
    }

    /**
     * get the current cache key-value store
     */
    getCache(): CacheKVStore {
        this.logger.verbose("Getting cache key-value store");
        return this.cache;
    }

    /**
     * sets the current cache (key value store)
     * @param cacheMap
     */
    setCache(cache: CacheKVStore): void {
        this.logger.verbose("Setting cache key value store");
        this.cache = cache;

        // mark change in cache
        this.emitChange();
    }

    /**
     * Gets cache item with given key.
     * @param key
     */
    getItem(key: string): ValidCacheType {
        this.logger.verbosePii(`Item key: ${key}`);

        // read cache
        const cache = this.getCache();
        return cache[key];
    }

    /**
     * Gets cache item with given <key, value>
     * @param key
     * @param value
     */
    setItem(key: string, value: ValidCacheType): void {
        this.logger.verbosePii(`Item key: ${key}`);

        // read cache
        const cache = this.getCache();
        cache[key] = value;

        // write to cache
        this.setCache(cache);
    }

    /**
     * fetch the account entity
     * @param accountKey
     */
    getAccount(accountKey: string): AccountEntity | null {
        const account = this.getItem(accountKey) as AccountEntity;
        if (AccountEntity.isAccountEntity(account)) {
            return account;
        }
        return null;
    }

    /**
     * set account entity
     * @param account
     */
    setAccount(account: AccountEntity): void {
        const accountKey = account.generateAccountKey();
        this.setItem(accountKey, account);
    }

    /**
     * fetch the idToken credential
     * @param idTokenKey
     */
    getIdTokenCredential(idTokenKey: string): IdTokenEntity | null {
        const idToken = this.getItem(idTokenKey) as IdTokenEntity;
        if (IdTokenEntity.isIdTokenEntity(idToken)) {
            return idToken;
        }
        return null;
    }

    /**
     * set idToken credential
     * @param idToken
     */
    setIdTokenCredential(idToken: IdTokenEntity): void {
        const idTokenKey = idToken.generateCredentialKey();
        this.setItem(idTokenKey, idToken);
    }

    /**
     * fetch the accessToken credential
     * @param accessTokenKey
     */
    getAccessTokenCredential(accessTokenKey: string): AccessTokenEntity | null {
        const accessToken = this.getItem(accessTokenKey) as AccessTokenEntity;
        if (AccessTokenEntity.isAccessTokenEntity(accessToken)) {
            return accessToken;
        }
        return null;
    }

    /**
     * set accessToken credential
     * @param accessToken
     */
    setAccessTokenCredential(accessToken: AccessTokenEntity): void {
        const accessTokenKey = accessToken.generateCredentialKey();
        this.setItem(accessTokenKey, accessToken);
    }

    /**
     * fetch the refreshToken credential
     * @param refreshTokenKey
     */
    getRefreshTokenCredential(refreshTokenKey: string): RefreshTokenEntity | null {
        const refreshToken = this.getItem(refreshTokenKey) as RefreshTokenEntity;
        if (RefreshTokenEntity.isRefreshTokenEntity(refreshToken)) {
            return refreshToken as RefreshTokenEntity;
        }
        return null;
    }

    /**
     * set refreshToken credential
     * @param refreshToken
     */
    setRefreshTokenCredential(refreshToken: RefreshTokenEntity): void {
        const refreshTokenKey = refreshToken.generateCredentialKey();
        this.setItem(refreshTokenKey, refreshToken);
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param appMetadataKey
     */
    getAppMetadata(appMetadataKey: string): AppMetadataEntity | null {
        const appMetadata: AppMetadataEntity = this.getItem(appMetadataKey) as AppMetadataEntity;
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
        this.setItem(appMetadataKey, appMetadata);
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param serverTelemetrykey
     */
    getServerTelemetry(serverTelemetrykey: string): ServerTelemetryEntity | null {
        const serverTelemetryEntity: ServerTelemetryEntity = this.getItem(serverTelemetrykey) as ServerTelemetryEntity;
        if (serverTelemetryEntity && ServerTelemetryEntity.isServerTelemetryEntity(serverTelemetrykey, serverTelemetryEntity)) {
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
        this.setItem(serverTelemetryKey, serverTelemetry);
    }

    /**
     * fetch authority metadata entity from the platform cache
     * @param key
     */
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        const authorityMetadataEntity: AuthorityMetadataEntity = this.getItem(key) as AuthorityMetadataEntity;
        if (authorityMetadataEntity && AuthorityMetadataEntity.isAuthorityMetadataEntity(key, authorityMetadataEntity)) {
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
     * @param key
     * @param metadata
     */
    setAuthorityMetadata(key: string, metadata: AuthorityMetadataEntity): void {
        this.setItem(key, metadata);
    }

    /**
     * fetch throttling entity from the platform cache
     * @param throttlingCacheKey
     */
    getThrottlingCache(throttlingCacheKey: string): ThrottlingEntity | null {
        const throttlingCache: ThrottlingEntity = this.getItem(throttlingCacheKey) as ThrottlingEntity;
        if (throttlingCache && ThrottlingEntity.isThrottlingEntity(throttlingCacheKey, throttlingCache)) {
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
        this.setItem(throttlingCacheKey, throttlingCache);
    }

    /**
     * Removes the cache item from memory with the given key.
     * @param key
     * @param inMemory
     */
    removeItem(key: string): boolean {
        this.logger.verbosePii(`Item key: ${key}`);

        // read inMemoryCache
        let result: boolean = false;
        const cache = this.getCache();

        if (!!cache[key]) {
            delete cache[key];
            result = true;
        }

        // write to the cache after removal
        if (result) {
            this.setCache(cache);
            this.emitChange();
        }
        return result;
    }

    /**
     * Checks whether key is in cache.
     * @param key
     */
    containsKey(key: string): boolean {
        return this.getKeys().includes(key);
    }

    /**
     * Gets all keys in window.
     */
    getKeys(): string[] {
        this.logger.verbose("Retrieving all cache keys");

        // read cache
        const cache = this.getCache();
        return [ ...Object.keys(cache)];
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(): void {
        this.logger.verbose("Clearing cache entries created by MSAL");

        // read inMemoryCache
        const cacheKeys = this.getKeys();

        // delete each element
        cacheKeys.forEach(key => {
            this.removeItem(key);
        });
        this.emitChange();
    }

    /**
     * Initialize in memory cache from an exisiting cache vault
     * @param cache
     */
    static generateInMemoryCache(cache: string): InMemoryCache {
        return Deserializer.deserializeAllCache(
            Deserializer.deserializeJSONBlob(cache)
        );
    }

    /**
     * retrieves the final JSON
     * @param inMemoryCache
     */
    static generateJsonCache(inMemoryCache: InMemoryCache): JsonCache {
        return Serializer.serializeAllCache(inMemoryCache);
    }
}
