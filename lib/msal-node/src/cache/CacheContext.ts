/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    JsonCache,
    Deserializer,
    Serializer,
    StringUtils,
} from '@azure/msal-common';
import { CacheManager } from '../cache/CacheManager';
import { Storage } from '../cache/Storage';

/**
 * class managing sync between the persistent cache blob in the disk and the in memory cache of the node
 */
export class CacheContext {
    private cachePath: string;
    private defaultSerializedCache: JsonCache = {
        Account: {},
        IdToken: {},
        AccessToken: {},
        RefreshToken: {},
        AppMetadata: {},
    };

    constructor() {
        this.cachePath = '';
    }

    /**
     * sets the cache path provided by the user
     * @param path
     */
    setCachePath(path: string) {
        this.cachePath = path;
    }

    /**
     * Update the library cache
     * @param storage
     */
    async setCurrentCache(storage: Storage) {
        const cache = await this.syncCache(storage);
        storage.setCache(Deserializer.deserializeAllCache(cache));
    }

    /**
     * read the cache from storage and merge it with the current cache
     * TODO: Make sure this operation is atomic - file lock that prevents anyone from changing it
     * @param storage
     */
    async syncCache(storage: Storage): Promise<JsonCache> {
        if (!StringUtils.isEmpty(this.cachePath)) {
            const currentCache = Serializer.serializeAllCache(
                storage.getCache()
            );
            const tCache = Deserializer.deserializeJSONBlob(
                await CacheManager.readFromFile(this.cachePath)
            );
            return this.mergeCache(tCache, currentCache);
        }

        return this.defaultSerializedCache;
    }

    /**
     * Merges two cache entities
     * @param currentCache
     * @param persistentCache
     */
    mergeCache(persistentCache: JsonCache, currentCache: JsonCache): JsonCache {
        return {
            Account: { ...persistentCache.Account, ...currentCache.Account },
            IdToken: { ...persistentCache.IdToken, ...currentCache.IdToken },
            AccessToken: {
                ...persistentCache.AccessToken,
                ...currentCache.AccessToken,
            },
            RefreshToken: {
                ...persistentCache.RefreshToken,
                ...currentCache.RefreshToken,
            },
            AppMetadata: {
                ...persistentCache.AppMetadata,
                ...currentCache.AppMetadata,
            },
        };
    }
}
