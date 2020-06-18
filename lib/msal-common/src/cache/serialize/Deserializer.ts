/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountEntity } from "../entities/AccountEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AppMetadataEntity } from "../entities/AppMetadataEntity";
import { CacheHelper } from "../utils/CacheHelper";
import { AccountCacheMaps, IdTokenCacheMaps, AccessTokenCacheMaps, RefreshTokenCacheMaps, AppMetadataCacheMaps } from "./JsonKeys";
import { AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache, InMemoryCache, JsonCache } from "../utils/CacheTypes";
import { StringDict } from "../../utils/MsalTypes";
import { StringUtils } from "../../utils/StringUtils";

// TODO: Can we write this with Generics?
export class Deserializer {

    /**
     * Parse the JSON blob in memory and deserialize the content
     * @param cachedJson
     */
    static deserializeJSONBlob(jsonFile: string): JsonCache {
        const deserializedCache = StringUtils.isEmpty(jsonFile)
            ? {}
            : JSON.parse(jsonFile);
        return deserializedCache;
    }

    /**
     * Deserializes accounts to AccountEntity objects
     * @param accounts
     */
    static deserializeAccounts(accounts: StringDict): AccountCache {
        const accountObjects = {};
        Object.keys(accounts).map(function (key) {
            const mappedAcc = CacheHelper.renameKeys(
                accounts[key],
                AccountCacheMaps.fromCacheMap
            );
            const account: AccountEntity = new AccountEntity();
            CacheHelper.toObject(account, mappedAcc);
            accountObjects[key] = account;
        });

        return accountObjects;
    }

    /**
     * Deserializes id tokens to IdTokenEntity objects
     * @param idTokens
     */
    static deserializeIdTokens(idTokens: StringDict): IdTokenCache {
        const idObjects = {};
        Object.keys(idTokens).map(function (key) {
            const mappedIdT = CacheHelper.renameKeys(
                idTokens[key],
                IdTokenCacheMaps.fromCacheMap
            );
            const idToken: IdTokenEntity = new IdTokenEntity();
            CacheHelper.toObject(idToken, mappedIdT);
            idObjects[key] = idToken;
        });

        return idObjects;
    }

    /**
     * Deserializes access tokens to AccessTokenEntity objects
     * @param accessTokens
     */
    static deserializeAccessTokens(accessTokens: StringDict): AccessTokenCache {
        const atObjects = {};
        Object.keys(accessTokens).map(function (key) {
            const mappedAT = CacheHelper.renameKeys(
                accessTokens[key],
                AccessTokenCacheMaps.fromCacheMap
            );
            const accessToken: AccessTokenEntity = new AccessTokenEntity();
            CacheHelper.toObject(accessToken, mappedAT);
            atObjects[key] = accessToken;
        });

        return atObjects;
    }

    /**
     * Deserializes refresh tokens to RefreshTokenEntity objects
     * @param refreshTokens
     */
    static deserializeRefreshTokens(refreshTokens: StringDict): RefreshTokenCache {
        const rtObjects = {};
        Object.keys(refreshTokens).map(function (key) {
            const mappedRT = CacheHelper.renameKeys(
                refreshTokens[key],
                RefreshTokenCacheMaps.fromCacheMap
            );
            const refreshToken: RefreshTokenEntity = new RefreshTokenEntity();
            CacheHelper.toObject(refreshToken, mappedRT);
            rtObjects[key] = refreshToken;
        });

        return rtObjects;
    }

    /**
     * Deserializes appMetadata to AppMetaData objects
     * @param appMetadata
     */
    static deserializeAppMetadata(appMetadata: StringDict): AppMetadataCache {
        const appMetadataObjects = {};
        Object.keys(appMetadata).map(function (key) {
            const mappedAmd = CacheHelper.renameKeys(
                appMetadata[key],
                AppMetadataCacheMaps.fromCacheMap
            );
            const amd: AppMetadataEntity = new AppMetadataEntity();
            CacheHelper.toObject(amd, mappedAmd);
            appMetadataObjects[key] = amd;
        });

        return appMetadataObjects;
    }

    /**
     * Deserialize an inMemory Cache
     * @param jsonCache
     */
    static deserializeAllCache(jsonCache: JsonCache): InMemoryCache {
        return {
            accounts: jsonCache.Account? this.deserializeAccounts(jsonCache.Account): {},
            idTokens: jsonCache.IdToken? this.deserializeIdTokens(jsonCache.IdToken): {},
            accessTokens: jsonCache.AccessToken? this.deserializeAccessTokens(jsonCache.AccessToken) : {},
            refreshTokens: jsonCache.RefreshToken? this.deserializeRefreshTokens(jsonCache.RefreshToken): {},
            appMetadata: jsonCache.AppMetadata? this.deserializeAppMetadata(jsonCache.AppMetadata): {}
        };
    }
}
