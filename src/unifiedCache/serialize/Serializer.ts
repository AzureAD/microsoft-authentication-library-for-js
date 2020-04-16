/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AccountEntity } from "../entities/AccountEntity";
import { AppMetadataEntity} from "../entities/AppMetadataEntity";
import { CacheHelper } from "../utils/CacheHelper";
import {
    AccessTokenCacheMaps,
    IdTokenCacheMaps,
    RefreshTokenCacheMaps,
    AccountCacheMaps,
    AppMetadataCacheMaps
} from "./JsonKeys";
import { CacheInMemObjects } from "../serialize/CacheInterface";
import { AccessTokenCache, IdTokenCache, RefreshTokenCache, AccountCache, AppMetadataCache } from "../../utils/MsalTypes";
import { CacheJson } from "./CacheInterface";

export class Serializer {
    /**
     * generate an access token CacheEntity
     * @param accessToken
     */
    static serializeAccessTokenEntity(accessToken: AccessTokenEntity) {
        const mappedAT: string = CacheHelper.renameKeys(
            accessToken,
            AccessTokenCacheMaps.toCacheMap
        );
        const atKey: string = accessToken.generateAccessTokenEntityKey();

        return {
            [atKey]: mappedAT
        };
    }

    /**
     * generate an id token CacheEntity
     * @param idToken
     */
    static serializeIdTokenCacheEntity(idToken: IdTokenEntity) {
        const mappedIdToken: string = CacheHelper.renameKeys(
            idToken,
            IdTokenCacheMaps.toCacheMap
        );
        const idTokenKey: string = idToken.generateIdTokenEntityKey();

        return {
            [idTokenKey]: mappedIdToken
        };
    }

    /**
     * generate a refreshToken CacheEntity
     * @param refreshToken
     */
    static serializeRefreshTokenCacheEntity(refreshToken: RefreshTokenEntity) {
        const mappedRT: string = CacheHelper.renameKeys(
            refreshToken,
            RefreshTokenCacheMaps.toCacheMap
        );
        const rtKey: string = refreshToken.generateRefreshTokenEntityKey();

        return {
            [rtKey]: mappedRT
        };
    }

    /**
     * generate an account CacheEntity
     * @param account
     */
    static serializeAccountCacheEntity(account: AccountEntity) {
        const mappedAccount: string = CacheHelper.renameKeys(
            account,
            AccountCacheMaps.toCacheMap
        );
        const acKey: string = account.generateAccountEntityKey();

        return {
            [acKey]: mappedAccount
        };
    }

    /**
     * generate an appMetadata CacheEntity
     * @param appMetadata
     */
    static serializeAppMetadataCacheEntity(appMetadata: AppMetadataEntity) {
        const mappedAppMetadata: string = CacheHelper.renameKeys(
            appMetadata,
            AppMetadataCacheMaps.toCacheMap
        );
        const appMetadataKey: string = appMetadata.generateAppMetaDataEntityKey();

        return {
            [appMetadataKey]: mappedAppMetadata
        };
    }

    /**
     * Serializes AccessTokens
     * @param atCache
     */
    static serializeAccessTokens(atCache: AccessTokenCache) {
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
     * Serialize IdTokens
     * @param idTCache
     */
    static serializeIdTokens(idTCache: IdTokenCache) {
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
     * Serialize refreshTokens
     * @param rtCache
     */
    static serializeRefreshTokens(rtCache: RefreshTokenCache) {
        const refreshTokens = {};
        Object.keys(rtCache).map(function (key) {
            const mappedRT = CacheHelper.renameKeys(
                rtCache[key],
                RefreshTokenCacheMaps.toCacheMap
            );
            rtCache[key] = mappedRT;
        });

        return refreshTokens;
    }

    /**
     * Serialize Accounts
     * @param accCache
     */
    static serializeAccounts(accCache: AccountCache) {
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
     * Serialize amdtCache
     * @param amdtCache
     */
    static serializeAppMetadata(amdtCache: AppMetadataCache) {
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
    static serializeAllCache(inMemCache: CacheInMemObjects): CacheJson {
        return {
            AccessToken: Serializer.serializeAccessTokens(inMemCache.accessTokens),
            IdToken: Serializer.serializeIdTokens(inMemCache.idTokens),
            RefreshToken: Serializer.serializeRefreshTokens(inMemCache.refreshTokens),
            Account: Serializer.serializeAccounts(inMemCache.accounts),
            AppMetadata: Serializer.serializeAppMetadata(inMemCache.appMetadata)
        };
    }
}
