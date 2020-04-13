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
        }
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
        }
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
        }
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
        }
    }
}
