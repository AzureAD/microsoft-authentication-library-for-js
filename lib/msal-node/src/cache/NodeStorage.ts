/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICacheStorage, CacheInterface, CacheTypes } from '@azure/msal-common';
import { NodeCacheManager } from './NodeCacheManager';
import { CacheOptions } from '../config/ClientConfiguration';

/**
 * This class implements the cache storage interface for MSAL through browser local or session storage.
 * Cookies are only used if storeAuthStateInCookie is true, and are only used for
 * parameters such as state and nonce, generally.
 */
export class NodeStorage implements ICacheStorage {
    // Cache configuration, either set by user or default values.
    private cacheConfig: CacheOptions;
    private cachePath: string;
    nodeCacheManager: NodeCacheManager;

    constructor(cacheConfig: CacheOptions) {
        this.cacheConfig = cacheConfig;
        this.cachePath = this.cacheConfig.cacheLocation!;
        this.nodeCacheManager = new NodeCacheManager(this.cachePath);
    }

    /**
     * retrieve the file Path to read the cache from
     */
    getCachePath(): string {
        return this.cachePath;
    }

    // TODO: get rid of the switch statements after the lookup

    /**
     * Sets the cache item with the key and value given.
     * Stores in cookie if storeAuthStateInCookie is set to true.
     * This can cause cookie overflow if used incorrectly.
     * @param key
     * @param value
     */
    setItem(key: string, value: string, cacheType?: CacheTypes): void {
        const cacheItem = { [key]: value };
        switch (cacheType) {
            case CacheTypes.ACCESS_TOKEN:
                CacheInterface.generateAccessTokenCache(cacheItem);
                break;
            case CacheTypes.ID_TOKEN:
                CacheInterface.generateIdTokenCache(cacheItem);
                break;
            case CacheTypes.REFRESH_TOKEN:
                CacheInterface.generateRefreshTokenCache(cacheItem);
                break;
            case CacheTypes.ACCOUNT:
                CacheInterface.generateAccountCache(cacheItem);
                break;
            case CacheTypes.APP_META_DATA:
                CacheInterface.generateAppMetadataCache(cacheItem);
                break;
            default:
                return;
        }
    }

    /**
     * Gets cache item with given key.
     * Will retrieve frm cookies if storeAuthStateInCookie is set to true.
     * @param key
     */
    getItem(key: string, cacheType?: CacheTypes): any {
        switch (cacheType) {
            case CacheTypes.ACCESS_TOKEN:
                return this.nodeCacheManager.inMemoryCache.accessTokens[key];
            case CacheTypes.ID_TOKEN:
                return this.nodeCacheManager.inMemoryCache.idTokens[key];
            case CacheTypes.REFRESH_TOKEN:
                return this.nodeCacheManager.inMemoryCache.refreshTokens[key];
            case CacheTypes.ACCOUNT:
                return this.nodeCacheManager.inMemoryCache.accounts[key];
            case CacheTypes.APP_META_DATA:
                return this.nodeCacheManager.inMemoryCache.appMetadata[key];
            default:
                return null;
        }
    }

    /**
     * Removes the cache item with the given key.
     * Will also clear the cookie item if storeAuthStateInCookie is set to true.
     * @param key
     */
    removeItem(key: string, cacheType?: CacheTypes): void {
        switch (cacheType) {
            case CacheTypes.ACCESS_TOKEN:
                delete this.nodeCacheManager.inMemoryCache.accessTokens[key];
                return;
            case CacheTypes.ID_TOKEN:
                delete this.nodeCacheManager.inMemoryCache.idTokens[key];
                return;
            case CacheTypes.REFRESH_TOKEN:
                delete this.nodeCacheManager.inMemoryCache.refreshTokens[key];
                return;
            case CacheTypes.ACCOUNT:
                delete this.nodeCacheManager.inMemoryCache.accounts[key];
                return;
            case CacheTypes.APP_META_DATA:
                delete this.nodeCacheManager.inMemoryCache.appMetadata[key];
                return;
            default:
                return;
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
