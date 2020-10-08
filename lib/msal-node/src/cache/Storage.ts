/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    AccountEntity,
    AccessTokenEntity,
    RefreshTokenEntity,
    IdTokenEntity,
    AppMetadataEntity,
    CacheManager,
    Logger,
    ValidCacheType,
    CredentialEntity,
    Constants as CommonConstants, ThrottlingEntity
} from "@azure/msal-common";
import { ServerTelemetryEntity } from "@azure/msal-common/dist/src/cache/entities/ServerTelemetryEntity";
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

    constructor(logger: Logger) {
        super();
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
     * @param key
     */
    getAccount(key: string): AccountEntity | null {
        const account: AccountEntity = this.getItem(key) as AccountEntity;
        if (AccountEntity.isAccountEntity(account)) {
            return account;
        }
        return null;
    }

    /**
     * set account entity
     * @param key
     * @param value
     */
    setAccount(key: string, value: AccountEntity): void {
        this.setItem(key, value);
    }

    /**
     * fetch the credential entity (IdToken/AccessToken/RefreshToken)
     * @param key
     */
    getCredential(key: string): CredentialEntity | null {
        const credential: CredentialEntity = this.getItem(key) as CredentialEntity;
        if (CredentialEntity.getCredentialType(key) !== CommonConstants.NOT_DEFINED) {
            return credential;
        }
        return null;
    }

    /**
     * set credential entity (IdToken/AccessToken/RefreshToken)
     * @param key
     * @param value
     */
    setCredential(key: string, value: CredentialEntity): void {
        this.setItem(key, value);
    }

    /**
     * fetch appMetadata entity from the platform cache
     * @param key
     */
    getAppMetadata(key: string): AppMetadataEntity | null {
        const appMetadata: AppMetadataEntity = this.getItem(key) as AppMetadataEntity;
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
        this.setItem(key, value);
    }

    /**
     * fetch server telemetry entity from the platform cache
     * @param key
     */
    getServerTelemetry(key: string): ServerTelemetryEntity | null {
        const serverTelemetryEntity: ServerTelemetryEntity = this.getItem(key) as ServerTelemetryEntity;
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
        this.setItem(key, value);
    }

    /**
     * fetch throttling entity from the platform cache
     * @param key
     */
    getThrottlingCache(key: string): ThrottlingEntity | null {
        const throttlingCache: ThrottlingEntity = this.getItem(key) as ThrottlingEntity;
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
        this.setItem(key, value);
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
