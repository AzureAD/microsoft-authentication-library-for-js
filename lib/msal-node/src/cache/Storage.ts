/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICacheStorage, InMemoryCache, CredentialType, CacheHelper} from '@azure/msal-common';
import { CacheOptions } from '../config/Configuration';

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage implements ICacheStorage {
    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    private inMemoryCache: InMemoryCache;

    constructor(cacheConfig: CacheOptions) {
        this.cacheConfig = cacheConfig;
        if (this.cacheConfig.cacheLocation! === 'fileCache')
            this.inMemoryCache = this.cacheConfig.cacheInMemory!;
    }

    /**
     * gets the current in memory cache for the client
     */
    getCache(): InMemoryCache {
        return this.inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache
     */
    setCache(inMemoryCache: InMemoryCache) {
        this.inMemoryCache = inMemoryCache;
    }

    /**
     * Sets the cache item with the key and value given.
     * @param key
     * @param value
     */
    setItem(key: string, value: string): void {

    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     * TODO: implement after the lookup implementation
     */
    getItem(key: string): string {
        return key ? 'random' : 'truly random';
    }

    /**
     * Removes the cache item with the given key.
     * @param key
     */
    removeItem(key: string): boolean {
        const cache = this.getCache();

        switch (CacheHelper.getCredentialType(key)) {
            case CredentialType.ID_TOKEN:
                delete cache.idTokens[key];
                return true;
            case CredentialType.ACCESS_TOKEN:
                delete cache.accessTokens[key];
                return true;
            case CredentialType.REFRESH_TOKEN:
                delete cache.refreshTokens[key];
                return true;
            default:
                console.log("Cache entity type mismatch");
                return false;
        }
    }

    /**
     * Checks whether key is in cache.
     * @param key
     * TODO: implement after the lookup implementation
     */
    containsKey(key: string): boolean {
        return key ? true : false;
    }

    /**
     * Gets all keys in window.
     * TODO: implement after the lookup implementation
     */
    getKeys(): string[] {
        return [];
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    clear(): void {
        return;
    }
}
