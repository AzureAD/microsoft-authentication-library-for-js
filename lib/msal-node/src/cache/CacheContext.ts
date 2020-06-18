/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Storage } from '../cache/Storage';
import { JsonCache } from "./serializer/SerializerTypes";
import { Deserializer } from "./serializer/Deserializer";

/**
 * class managing sync between the persistent cache blob in the disk and the in memory cache of the node
 */
export class CacheContext {
    private defaultSerializedCache: JsonCache = {
        Account: {},
        IdToken: {},
        AccessToken: {},
        RefreshToken: {},
        AppMetadata: {},
    };

    /**
     * Update the library cache
     * @param storage
     */
    setCurrentCache(storage: Storage, cacheObject: JsonCache) {
        const cacheWithOverlayedDefaults = this.overlayDefaults(cacheObject);
        storage.setCache(
            Deserializer.deserializeAllCache(cacheWithOverlayedDefaults)
        );
    }

    overlayDefaults(passedInCache: JsonCache): JsonCache {
        return {
            Account: {
                ...this.defaultSerializedCache.Account,
                ...passedInCache.Account,
            },
            IdToken: {
                ...this.defaultSerializedCache.IdToken,
                ...passedInCache.IdToken,
            },
            AccessToken: {
                ...this.defaultSerializedCache.AccessToken,
                ...passedInCache.AccessToken,
            },
            RefreshToken: {
                ...this.defaultSerializedCache.RefreshToken,
                ...passedInCache.RefreshToken,
            },
            AppMetadata: {
                ...this.defaultSerializedCache.AppMetadata,
                ...passedInCache.AppMetadata,
            },
        };
    }
}
