/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenCache } from "../entities/AccessTokenCache";
import { IdTokenCache } from "../entities/IdTokenCache";
import { RefreshTokenCache } from "../entities/RefreshTokenCache";
import { AccountCache } from "../entities/AccountCache";
import { AppMetadataCache } from "../entities/AppMetaDataCache";
import { CacheHelper } from "../utils/CacheHelper";
import {
    AccessTokenCacheMaps,
    IdTokenCacheMaps,
    RefreshTokenCacheMaps,
    AccountCacheMaps,
    AppMetadataCacheMaps
} from "./JSONKeys";

export class Serializer {
    /**
     * generate an access token CacheEntity
     * @param accessToken
     */
    static createAccessTokenCacheEntity(accessToken: AccessTokenCache) {
        const mappedAT: string = CacheHelper.renameKeys(
            accessToken,
            AccessTokenCacheMaps.toCacheMap
        );
        const atKey: string = accessToken.generateAccessTokenKey();

        let atCacheEntity: any = {};
        atCacheEntity[atKey] = mappedAT;
        return atCacheEntity;
    }

    /**
     * generate an id token CacheEntity
     * @param idToken
     */
    static createIdTokenCacheEntity(idToken: IdTokenCache) {
        const mappedIdToken: string = CacheHelper.renameKeys(
            idToken,
            IdTokenCacheMaps.toCacheMap
        );
        const idTokenKey: string = idToken.generateIdTokenKey();

        let idTokenCacheEntity: any = {};
        idTokenCacheEntity[idTokenKey] = mappedIdToken;
        return idTokenCacheEntity;
    }

    /**
     * generate a refreshToken CacheEntity
     * @param refreshToken
     */
    static createRefreshTokenCacheEntity(refreshToken: RefreshTokenCache) {
        const mappedRT: string = CacheHelper.renameKeys(
            refreshToken,
            RefreshTokenCacheMaps.toCacheMap
        );
        const rtKey: string = refreshToken.generateRefreshTokenKey();

        let rtCacheEntity: any = {};
        rtCacheEntity[rtKey] = mappedRT;
        return rtCacheEntity;
    }

    /**
     * generate an account CacheEntity
     * @param account
     */
    static createAccountCacheEntity(account: AccountCache) {
        const mappedAccount: string = CacheHelper.renameKeys(
            account,
            AccountCacheMaps.toCacheMap
        );
        const acKey: string = account.generateAccountCacheKey();

        let accountCacheEntity: any = {};
        accountCacheEntity[acKey] = mappedAccount;
        return accountCacheEntity;
    }

    /**
     * generate an appMetadata CacheEntity
     * @param appMetadata
     */
    static createAppMetadataCacheEntity(appMetadata: AppMetadataCache) {
        const mappedAppMetadata: string = CacheHelper.renameKeys(
            appMetadata,
            AppMetadataCacheMaps.toCacheMap
        );
        const appMetadataKey: string = appMetadata.generateAppMetaDataKey();

        let appMetadataCacheEntity: any = {};
        appMetadataCacheEntity[appMetadataKey] = mappedAppMetadata;
        return appMetadataCacheEntity;
    }
}
