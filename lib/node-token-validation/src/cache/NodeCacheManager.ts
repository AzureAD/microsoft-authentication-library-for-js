/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityMetadataEntity, CacheManager, ICrypto, Logger, ValidCacheType } from "@azure/msal-common";
import { CacheKVStore } from "./CacheTypes";

/**
 * This class class implements storage for node-token-validation.
 */
export class NodeCacheManager extends CacheManager {
    private logger: Logger;
    private cache: CacheKVStore = new Map();

    constructor(logger: Logger, clientId: string, cryptoImpl: ICrypto) {
        super(clientId, cryptoImpl);
        this.logger = logger;
    }

    /**
     * Gets the current cache key-value store
     * @returns {CacheKVStore} Key Value store for in-memory storage
     */
    getCache(): CacheKVStore {
        this.logger.trace("Getting cache");
        return this.cache;
    }

    /**
     * Sets the current cache key-value store
     * @param {CacheKVStore} cache 
     */
    setCache(cache: CacheKVStore): void {
        this.logger.trace("Setting cache");
        this.cache = cache;
    }

    /**
     * Gets cache item with given key-value
     * @param {string} key Lookup key for the cache entry
     * @returns {ValidCacheType} Cache entry
     */
    getItem(key: string): ValidCacheType {
        this.logger.tracePii(`Item key: ${key}`);

        // Read cache
        const cache = this.getCache();
        return cache[key];
    }

    /**
     * Sets cache item with given key-value
     * @param {string} key Lookup key for the cache entry
     * @param {ValidCacheType} value Value for the cache entry
     */
    setItem(key: string, value: ValidCacheType): void {
        this.logger.tracePii(`Item key: ${key}`);

        // Read cache
        const cache = this.getCache();
        cache[key] = value;

        // Write to cache
        this.setCache(cache);
    }

    /**
     * Removes the cache item from memory with the given key
     * @param {string} key Lookup key to remove a cache entity
     * @returns {boolean} Boolean indicating whether cache item was deleted
     */
    removeItem(key: string): boolean {
        this.logger.tracePii(`Item key: ${key}`);

        // Read cache
        let result: boolean = false;
        const cache = this.getCache();

        if (!!cache[key]) {
            delete cache[key];
            result = true;
        }

        // Write to the cache after removal
        if (result) {
            this.setCache(cache);
        }
        return result;
    }

    /**
     * Checks whether key is in cache
     * @param {string} key Lookup key for a cache entity
     * @returns {boolean} Boolean indicating whether cache contains key
     */
    containsKey(key: string): boolean {
        return this.getKeys().includes(key);
    }

    /**
     * Gets all cache keys
     * @returns {string[]} Array of cache keys
     */
    getKeys(): string[] {
        this.logger.trace("NodeCacheManager - Retrieving all cache keys");

        // Read cache
        const cache = this.getCache();
        return [ ...Object.keys(cache)];
    }

    /**
     * Clears all cache entries created
     */
    async clear(): Promise<void> {
        this.logger.trace("Clearing cache entries created");

        // Read cache
        const cacheKeys = this.getKeys();

        // Delete each element
        cacheKeys.forEach(key => {
            this.removeItem(key);
        });
    }

    getAccessTokenCredential(): null {
        throw new Error("Method not implemented.");
    }

    setAccessTokenCredential(): null {
        throw new Error("Method not implemented. setAccessTokenCredential");
    }

    getIdTokenCredential(): null {
        throw new Error("Method not implemented. getIdTokenCredential");
    }

    setIdTokenCredential(): null {
        throw new Error("Method not implemented. setIdTokenCredential");
    }

    getRefreshTokenCredential(): null {
        throw new Error("Method not implemented. getRefreshTokenCredential");
    }

    setRefreshTokenCredential(): null {
        throw new Error("Method not implemented. setRefreshTokenCredential");
    }

    getAccount(): null {
        throw new Error("Method not implemented. getAccount");
    }

    setAccount(): null {
        throw new Error("Method not implemented. setAccount");
    }

    getAppMetadata(): null {
        throw new Error("Method not implemented. getAppMetadata");
    }

    setAppMetadata(): null {
        throw new Error("Method not implemented. setAppMetadata");
    }

    /**
     * Fetch authority metadata entity from the cache
     * @param {string} key Lookup key to fetch cache type AuthorityMetadataEntity
     * @returns {AuthorityMetadataEntity} Authority metadata entity 
     */
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        this.logger.trace("NodeCacheManager.getAuthorityMetadata called");
        const authorityMetadataEntity: AuthorityMetadataEntity = this.getItem(key) as AuthorityMetadataEntity;
        if (authorityMetadataEntity && AuthorityMetadataEntity.isAuthorityMetadataEntity(key, authorityMetadataEntity)) {
            return authorityMetadataEntity;
        }
        return null;
    }

    /**
     * Get authority metadata keys
     * @returns {string[]} Array of authority metadata keys
     */
    getAuthorityMetadataKeys(): string[] {
        this.logger.trace("NodeCacheManager.getAuthorityMetadataKeys called");
        return this.getKeys().filter((key) => {
            return this.isAuthorityMetadata(key);
        });
    }

    /**
     * Set authority metadata entity to the cache
     * @param {string} key Lookup key to fetch cache type AuthorityMetadataEntity
     * @param {AuthorityMetadataEntity} metadata Cache value to be set type AuthorityMetadataEntity
     */
    setAuthorityMetadata(key: string, metadata: AuthorityMetadataEntity): void {
        this.logger.trace("NodeCacheManager.setAuthorityMetadata called");
        this.setItem(key, metadata);
    }

    getServerTelemetry(): null {
        throw new Error("Method not implemented. getServerTelemetry");
    }

    setServerTelemetry(): null {
        throw new Error("Method not implemented. setServerTelemetry");
    }

    getThrottlingCache(): null {
        throw new Error("Method not implemented. getThrottlingCache");
    }

    setThrottlingCache(): null {
        throw new Error("Method not implemented. setThrottlingCache");
    }

    updateCredentialCacheKey(): string {
        throw new Error("Method not implemented. setThrottlingCache");
    }
}
