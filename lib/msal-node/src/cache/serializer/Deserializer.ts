/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AccountCacheMaps, IdTokenCacheMaps, AccessTokenCacheMaps, RefreshTokenCacheMaps, AppMetadataCacheMaps } from "./JsonKeys";
import { StringUtils, AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache, CacheHelper, AccountEntity, IdTokenEntity, AccessTokenEntity, RefreshTokenEntity, AppMetadataEntity } from "@azure/msal-common";
import { JsonCache, InMemoryCache, Dict } from "./SerializerTypes";

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
    static deserializeAccounts(accounts: Dict): AccountCache {
        const accountObjects: AccountCache = {};
        if (accounts) {
            Object.keys(accounts).map(function (key) {
                const mappedAcc = CacheHelper.renameKeys(
                    accounts[key],
                    AccountCacheMaps.fromCacheMap
                );
                const account: AccountEntity = new AccountEntity();
                CacheHelper.toObject(account, mappedAcc);
                accountObjects[key] = account;
            });
        }

        return accountObjects;
    }

    /**
     * Deserializes id tokens to IdTokenEntity objects
     * @param idTokens
     */
    static deserializeIdTokens(idTokens: Dict): IdTokenCache {
        const idObjects: IdTokenCache = {};
        if (idTokens) {
            Object.keys(idTokens).map(function (key) {
                const mappedIdT = CacheHelper.renameKeys(
                    idTokens[key],
                    IdTokenCacheMaps.fromCacheMap
                );
                const idToken: IdTokenEntity = new IdTokenEntity();
                CacheHelper.toObject(idToken, mappedIdT);
                idObjects[key] = idToken;
            });
        }
        return idObjects;
    }

    /**
     * Deserializes access tokens to AccessTokenEntity objects
     * @param accessTokens
     */
    static deserializeAccessTokens(accessTokens: Dict): AccessTokenCache {
        const atObjects: AccessTokenCache = {};
        if (accessTokens) {
            Object.keys(accessTokens).map(function (key) {
                const mappedAT = CacheHelper.renameKeys(
                    accessTokens[key],
                    AccessTokenCacheMaps.fromCacheMap
                );
                const accessToken: AccessTokenEntity = new AccessTokenEntity();
                CacheHelper.toObject(accessToken, mappedAT);
                atObjects[key] = accessToken;
            });
        }

        return atObjects;
    }

    /**
     * Deserializes refresh tokens to RefreshTokenEntity objects
     * @param refreshTokens
     */
    static deserializeRefreshTokens(refreshTokens: Dict): RefreshTokenCache {
        const rtObjects: RefreshTokenCache = {};
        if (refreshTokens) {
            Object.keys(refreshTokens).map(function (key) {
                const mappedRT = CacheHelper.renameKeys(
                    refreshTokens[key],
                    RefreshTokenCacheMaps.fromCacheMap
                );
                const refreshToken: RefreshTokenEntity = new RefreshTokenEntity();
                CacheHelper.toObject(refreshToken, mappedRT);
                rtObjects[key] = refreshToken;
            });
        }

        return rtObjects;
    }

    /**
     * Deserializes appMetadata to AppMetaData objects
     * @param appMetadata
     */
    static deserializeAppMetadata(appMetadata: Dict): AppMetadataCache {
        const appMetadataObjects: AppMetadataCache = {};
        if (appMetadata) {
            Object.keys(appMetadata).map(function (key) {
                const mappedAmd = CacheHelper.renameKeys(
                    appMetadata[key],
                    AppMetadataCacheMaps.fromCacheMap
                );
                const amd: AppMetadataEntity = new AppMetadataEntity();
                CacheHelper.toObject(amd, mappedAmd);
                appMetadataObjects[key] = amd;
            });
        }

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
