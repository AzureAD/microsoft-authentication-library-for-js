/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccountCacheMaps, AccessTokenCacheMaps, IdTokenCacheMaps, RefreshTokenCacheMaps, AppMetadataCacheMaps } from "./JsonKeys";
import { AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache } from "@azure/msal-common";
import { CacheContext } from "cache/CacheContext";

export class EntitySerializer {
    /**
      * Convert AccountEntity to string
      * @param accCache
      * @param key
      */
    static mapAccountKeys(accCache: AccountCache, key: string): object {
        return {};
        // return CacheContext.renameKeys(
        //     {...accCache[key]},
        //     AccountCacheMaps.toCacheMap
        // );
    }

    /**
     * Convert IdTokenEntity to string
     * @param idTCache
     * @param key
     */
    static mapIdTokenKeys(idTCache: IdTokenCache, key: string): object {
        return {};
        // return CacheContext.renameKeys(
        //     idTCache[key],
        //     IdTokenCacheMaps.toCacheMap
        // );
    }

    /**
     * Convert AccessTokenEntity to string
     * @param atCache
     * @param key
     */
    static mapAccessTokenKeys(atCache: AccessTokenCache, key: string): object {
        return {};
        // return CacheContext.renameKeys(
        //     atCache[key],
        //     AccessTokenCacheMaps.toCacheMap
        // );
    }

    /**
     * Convert RefreshTokenEntity to string
     * @param rtCache
     * @param key
     */
    static mapRefreshTokenKeys(rtCache: RefreshTokenCache, key: string): object {
        return {};
        // return CacheContext.renameKeys(
        //     rtCache[key],
        //     RefreshTokenCacheMaps.toCacheMap
        // );
    }

    /**
     * Convert AppMetaDataEntity to string
     * @param amdtCache
     * @param key
     */
    static mapAppMetadataKeys(amdtCache: AppMetadataCache, key: string): object {
        return {};
        // return CacheContext.renameKeys(
        //     amdtCache[key],
        //     AppMetadataCacheMaps.toCacheMap
        // );
    }
}
