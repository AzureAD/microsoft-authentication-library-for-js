/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccessTokenEntity } from "../entities/AccessTokenEntity";
import { IdTokenEntity } from "../entities/IdTokenEntity";
import { RefreshTokenEntity } from "../entities/RefreshTokenEntity";
import { AccountEntity } from "../entities/AccountEntity";
import { AppMetadataEntity } from "../entities/AppMetadataEntity";
import { CacheHelper } from "../utils/CacheHelper";
import {
    AccessTokenCacheMaps,
    IdTokenCacheMaps,
    RefreshTokenCacheMaps,
    AccountCacheMaps,
    AppMetadataCacheMaps
} from "../serialize/JsonKeys";
import { AccessTokenCache, IdTokenCache, RefreshTokenCache, AccountCache, AppMetadataCache, StringDict } from "../../utils/MsalTypes";

// TODO: Can we write this with Generics?
export class Deserializer {
    /**
     * Deserializes access tokens to AccessTokenEntity objects
     * @param accessTokens
     */
    static deSerializeAccessTokens(accessTokens: StringDict): AccessTokenCache {
        const atObjects = {};
        Object.keys(accessTokens).map(function(key) {
            const mappedAT = CacheHelper.renameKeys(
                accessTokens[key],
                AccessTokenCacheMaps.fromCacheMap
            );
            const accessToken: AccessTokenEntity = new AccessTokenEntity();
            accessToken.toObject(mappedAT);
            atObjects[key] = accessToken;
        });

        return atObjects;
    }

    /**
     * Deserializes id tokens to IdTokenEntity objects
     * @param idTokens
     */
    static deSerializeIdTokens(idTokens: StringDict): IdTokenCache {
        const idObjects = {};
        Object.keys(idTokens).map(function(key) {
            const mappedIdT = CacheHelper.renameKeys(
                idTokens[key],
                IdTokenCacheMaps.fromCacheMap
            );
            const idToken: IdTokenEntity = new IdTokenEntity();
            idToken.toObject(mappedIdT);
            idObjects[key] = idToken;
        });

        return idObjects;
    }

    /**
     * Deserializes refresh tokens to RefreshTokenEntity objects
     * @param refreshTokens
     */
    static deSerializeRefreshTokens(refreshTokens: StringDict): RefreshTokenCache {
        const rtObjects = {};
        Object.keys(refreshTokens).map(function(key) {
            const mappedRT = CacheHelper.renameKeys(
                refreshTokens[key],
                RefreshTokenCacheMaps.fromCacheMap
            );
            const refreshToken: RefreshTokenEntity = new RefreshTokenEntity();
            refreshToken.toObject(mappedRT);
            rtObjects[key] = refreshToken;
        });

        return rtObjects;
    }
    /**
     * Deserializes accounts to AccountEntity objects
     * @param accounts
     */
    static deSerializeAccounts(accounts: StringDict): AccountCache {
        const accountObjects = {};
        Object.keys(accounts).map(function(key) {
            const mappedAcc = CacheHelper.renameKeys(
                accounts[key],
                AccountCacheMaps.fromCacheMap
            );
            const account: AccountEntity = new AccountEntity();
            account.toObject(mappedAcc);
            accountObjects[key] = account;
        });

        return accountObjects;
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
            amd.toObject(mappedAmd);
            appMetadataObjects[key] = amd;
        });

        return appMetadataObjects;
    }
}
