/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorityMetadataEntity, CacheManager, ICrypto, Logger, ValidCacheType } from "@azure/msal-common";
import { CacheKVStore } from "./CacheTypes";

export class NodeCacheManager extends CacheManager {
    private logger: Logger;
    private cache: CacheKVStore = {};
    private changeEmitters: Array<Function> = [];

    constructor(logger: Logger, clientId: string, cryptoImpl: ICrypto) {
        super(clientId, cryptoImpl);
        this.logger = logger;
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
        this.changeEmitters.forEach(func => func.call(null));
    }

    /**
     * Gets the current cache key-value store
     * @returns 
     */
    getCache(): CacheKVStore {
        this.logger.trace("Getting cache");
        return this.cache;
    }

    /**
     * Sets the current cache key-value store
     * @param cache 
     */
    setCache(cache: CacheKVStore): void {
        this.logger.trace("Setting cache");
        this.cache = cache;

        // Mark change in cache
        this.emitChange();
    }

    /**
     * Gets cache item with given key-value
     * @param key Lookup key for the cache entry
     * @returns 
     */
    getItem(key: string): ValidCacheType {
        this.logger.tracePii(`Item key: ${key}`);

        // Read cache
        const cache = this.getCache();
        return cache[key];
    }

    /**
     * Sets cache item with given key-value
     * @param key Lookup key for the cache entry
     * @param value Value for the cache entry
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
     * @param key Lookup key to remove a cache entity
     * @returns 
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
            this.emitChange();
        }
        return result;
    }

    /**
     * Checks whether key is in cache
     * @param key Lookup key for a cache entity
     * @returns 
     */
    containsKey(key: string): boolean {
        return this.getKeys().includes(key);
    }

    /**
     * Gets all cache keys
     * @returns 
     */
    getKeys(): string[] {
        this.logger.trace("Retrieving all cache keys");

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
        this.emitChange();
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
     * @param key Lookup key to fetch cache type AuthorityMetadataEntity
     * @returns 
     */
    getAuthorityMetadata(key: string): AuthorityMetadataEntity | null {
        const authorityMetadataEntity: AuthorityMetadataEntity = this.getItem(key) as AuthorityMetadataEntity;
        if (authorityMetadataEntity && AuthorityMetadataEntity.isAuthorityMetadataEntity(key, authorityMetadataEntity)) {
            return authorityMetadataEntity;
        }
        return null;
    }

    /**
     * Get authority metadata keys
     * @returns
     */
    getAuthorityMetadataKeys(): string[] {
        return this.getKeys().filter((key) => {
            return this.isAuthorityMetadata(key);
        });
    }

    /**
     * Set authority metadata entity to the cache
     * @param key Lookup key to fetch cache type AuthorityMetadataEntity
     * @param metadata Cache value to be set type AuthorityMetadataEntity
     */
    setAuthorityMetadata(key: string, metadata: AuthorityMetadataEntity): void {
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

