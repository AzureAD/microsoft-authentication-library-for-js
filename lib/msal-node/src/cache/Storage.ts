/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    ICacheStorageAsync,
    InMemoryCache
} from '@azure/msal-common';
import { CacheOptions } from '../config/Configuration';

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage implements ICacheStorageAsync {
    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    private inMemoryCache: InMemoryCache;

    // private beforeCacheAccess: Function;
    // private afterCacheAccess: Function;

    constructor(cacheConfig: CacheOptions) {
        this.cacheConfig = cacheConfig;
        if (this.cacheConfig.cacheLocation! === "fileCache")
            this.inMemoryCache = this.cacheConfig.cacheInMemory!;
    }

    /**
     * gets the current in memory cache for the client
     */
    async getCache(): Promise<InMemoryCache> {
        return this.inMemoryCache;
    }

    /**
     * sets the current in memory cache for the client
     * @param inMemoryCache
     */
    async setCache(inMemoryCache: InMemoryCache): Promise<void> {
        this.inMemoryCache = inMemoryCache;
        // this.afterCacheAccess(Serializer.serializeAllCache(this.inMemoryCache))
    }

    /**
     * Sets the cache item with the key and value given.
     * @param key
     * @param value
     * TODO: implement after the lookup implementation
     */
    async setItem(key: string, value: string): Promise<void> {
        if (key && value) {
            return;
        }
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     * TODO: implement after the lookup implementation
     */
    async getItem(key: string): Promise<string> {
        return key ? 'random' : 'truly random';
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     * TODO: implement after the lookup implementation
     */
    async removeItem(key: string): Promise<void> {
        if (!key) return;
    }

    /**
     * Checks whether key is in cache.
     * @param key
     * TODO: implement after the lookup implementation
     */
    async containsKey(key: string): Promise<boolean> {
        return key ? true : false;
    }

    /**
     * Gets all keys in window.
     * TODO: implement after the lookup implementation
     */
    async getKeys(): Promise<Array<string>> {
        return [];
    }

    /**
     * Clears all cache entries created by MSAL (except tokens).
     */
    async clear(): Promise<void> {
        return;
    }
}
