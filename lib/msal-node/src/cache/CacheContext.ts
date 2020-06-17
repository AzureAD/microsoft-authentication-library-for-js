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

    /**
     * helper function to swap keys and objects
     * @param cacheMap
     */
    static swap(cacheMap: {[index: string]: object}): object {
        const ret: {[index: string]: object | string} = {};
        for (const key in cacheMap) {
            ret[JSON.stringify(cacheMap[key])] = key;
        }
        return ret;
    }

    /**
     * helper function to map an obj to a new keyset
     * @param objAT
     * @param keysMap
     */
    static renameKeys(objAT: {[index: string]: object}, keysMap: {[index: string]: object}): object {
        const keyValues = Object.keys(objAT).map((key) => {
            if (objAT[key]) {
                const newKey = JSON.stringify(keysMap[key]) || key;
                return { [newKey]: objAT[key] };
            }
            return null;
        });
        return Object.assign({}, ...keyValues);
    }
}
