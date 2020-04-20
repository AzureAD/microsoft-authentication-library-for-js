/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CacheHelper } from "../utils/CacheHelper";
import { AccountCacheMaps, AccessTokenCacheMaps, IdTokenCacheMaps, RefreshTokenCacheMaps, AppMetadataCacheMaps } from "./JsonKeys";
import { AccountCache, AccessTokenCache, IdTokenCache, RefreshTokenCache, AppMetadataCache, JsonCache, InMemoryCache } from "../utils/CacheTypes";
import { StringDict } from "../../utils/MsalTypes";

export class Serializer {

    /**
     * serialize the JSON blob
     * @param data
     */
    static serializeJSONBlob(data: JsonCache): string {
        return JSON.stringify(data);
    }

    /**
     * Serialize Accounts
     * @param accCache
     */
    static serializeAccounts(accCache: AccountCache): StringDict {
        const accounts = {};
        Object.keys(accCache).map(function (key) {
            const mappedAcc = CacheHelper.renameKeys(
                accCache[key],
                AccountCacheMaps.toCacheMap
            );
            accounts[key] = mappedAcc;
        });

        return accounts;
    }

    /**
     * Serialize IdTokens
     * @param idTCache
     */
    static serializeIdTokens(idTCache: IdTokenCache): StringDict{
        const idTokens = {};
        Object.keys(idTCache).map(function (key) {
            const mappedIdT = CacheHelper.renameKeys(
                idTCache[key],
                IdTokenCacheMaps.toCacheMap
            );
            idTokens[key] = mappedIdT;
        });

        return idTokens;
    }

    /**
     * Serializes AccessTokens
     * @param atCache
     */
    static serializeAccessTokens(atCache: AccessTokenCache): StringDict {
        // access tokens
        const accessTokens = {};
        Object.keys(atCache).map(function (key) {
            const mappedAT = CacheHelper.renameKeys(
                atCache[key],
                AccessTokenCacheMaps.toCacheMap
            );
            accessTokens[key] = mappedAT;
        });

        return accessTokens;
    }

    /**
     * Serialize refreshTokens
     * @param rtCache
     */
    static serializeRefreshTokens(rtCache: RefreshTokenCache): StringDict{
        const refreshTokens = {};
        Object.keys(rtCache).map(function (key) {
            const mappedRT = CacheHelper.renameKeys(
                rtCache[key],
                RefreshTokenCacheMaps.toCacheMap
            );
            refreshTokens[key] = mappedRT;
        });

        return refreshTokens;
    }

    /**
     * Serialize amdtCache
     * @param amdtCache
     */
    static serializeAppMetadata(amdtCache: AppMetadataCache): StringDict {
        const appMetadata = {};
        Object.keys(amdtCache).map(function (key) {
            const mappedAmdt = CacheHelper.renameKeys(
                amdtCache[key],
                AppMetadataCacheMaps.toCacheMap
            );
            appMetadata[key] = mappedAmdt;
        });

        return appMetadata;
    }

    /**
     * Serialize the cache
     * @param jsonContent
     */
    static serializeAllCache(inMemCache: InMemoryCache): JsonCache {
        return {
            Account: this.serializeAccounts(inMemCache.accounts),
            IdToken: this.serializeIdTokens(inMemCache.idTokens),
            AccessToken: this.serializeAccessTokens(inMemCache.accessTokens),
            RefreshToken: this.serializeRefreshTokens(inMemCache.refreshTokens),
            AppMetadata: this.serializeAppMetadata(inMemCache.appMetadata),
        };
    }
}
