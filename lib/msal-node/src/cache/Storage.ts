/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICacheStorage } from '@azure/msal-common';
import { CacheManager } from './CacheManager';
import { CacheOptions } from '../config/ClientConfiguration';

/**
 * This class implements Storage for node, reading cache from user specified storage location or an  extension library
 */
export class Storage implements ICacheStorage {
    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    private cachePath: string;
    private cacheManager: CacheManager;

    constructor(cacheConfig: CacheOptions) {
        this.cacheConfig = cacheConfig;
        this.cachePath = this.cacheConfig.cacheLocation!;
        this.cacheManager = new CacheManager();
    }

    /**
     * retrieve the file Path to read the cache from
     */
    getCachePath(): string {
        return this.cachePath;
    }

    /**
     * read JSON formatted cache from disk
     */
    async getSerializedCache(): Promise<string> {
        const serializedCache = await this.cacheManager.readFromFile(this.cachePath);
        return serializedCache;
    }

    /**
     * write the JSON formatted cache to disk
     * @param jsonCache
     */
    async setSerializedCache(cache: string): Promise<void> {
        this.cacheManager.writeToFile(this.cachePath, cache);
    }

    /**
     * Sets the cache item with the key and value given.
     * @param key
     * @param value
     * TODO: implement after the lookup implementation
     */
    setItem(key: string, value: string): void {
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
    getItem(key: string): string {
        return key ? 'random' : 'truly random';
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     * TODO: implement after the lookup implementation
     */
    removeItem(key: string): void {
        if (!key) return;
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
