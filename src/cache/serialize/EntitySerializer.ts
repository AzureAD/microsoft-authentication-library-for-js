/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccountCacheMaps, AccessTokenCacheMaps, IdTokenCacheMaps, RefreshTokenCacheMaps, AppMetadataCacheMaps } from "./JsonKeys";
import { AccountCache, AccessTokenCache, IdTokenCache, RefreshTokenCache, AppMetadataCache } from "../utils/CacheTypes";
import { CacheHelper } from "../utils/CacheHelper";

export class EntitySerializer {
    /**
      * Convert AccountEntity to string
      * @param accCache
      * @param key
      */
    static mapAccountKeys(accCache: AccountCache, key: string): object {
        return CacheHelper.renameKeys(
            accCache[key],
            AccountCacheMaps.toCacheMap
        );
    }

    /**
     * Convert IdTokenEntity to string
     * @param idTCache
     * @param key
     */
    static mapIdTokenKeys(idTCache: IdTokenCache, key: string): object {
        return CacheHelper.renameKeys(
            idTCache[key],
            IdTokenCacheMaps.toCacheMap
        );
    }

    /**
     * Convert AccessTokenEntity to string
     * @param atCache
     * @param key
     */
    static mapAccessTokenKeys(atCache: AccessTokenCache, key: string): object {
        return CacheHelper.renameKeys(
            atCache[key],
            AccessTokenCacheMaps.toCacheMap
        );
    }

    /**
     * Convert RefreshTokenEntity to string
     * @param rtCache
     * @param key
     */
    static mapRefreshTokenKeys(rtCache: RefreshTokenCache, key: string): object {
        return CacheHelper.renameKeys(
            rtCache[key],
            RefreshTokenCacheMaps.toCacheMap
        );
    }

    /**
     * Convert AppMetaDataEntity to string
     * @param amdtCache
     * @param key
     */
    static mapAppMetadataKeys(amdtCache: AppMetadataCache, key: string): object {
        return CacheHelper.renameKeys(
            amdtCache[key],
            AppMetadataCacheMaps.toCacheMap
        );
    }
}
