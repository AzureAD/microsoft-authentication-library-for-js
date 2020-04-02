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
} from "../serialize/JsonKeys";

// TODO: Can we write generalized code for this with Generics?
export class Deserializer {
    /**
     * Deserializes access tokens to AccessTokenCache objects
     * @param accessTokens
     */
    static deSerializeAccessTokens(accessTokens: Array<string>): Array<AccessTokenCache> {
        let atObjects: Array<AccessTokenCache> = [];
        accessTokens.forEach((element: any) => {
            const mappedAT: string = CacheHelper.renameKeys(
                element,
                AccessTokenCacheMaps.fromCacheMap
            );
            const accessToken: AccessTokenCache = new AccessTokenCache();
            accessToken.toObject(mappedAT);
            atObjects.push(accessToken);
        });

        return atObjects;
    }

    /**
     * Deserializes id tokens to IdTokenCache objects
     * @param idTokens
     */
    static deSerializeIdTokens(idTokens: Array<string>): Array<IdTokenCache> {
        let idObjects: Array<IdTokenCache> = [];
        idTokens.forEach((element: any) => {
            const mappedId: string = CacheHelper.renameKeys(
                element,
                IdTokenCacheMaps.fromCacheMap
            );
            const idToken: IdTokenCache = new IdTokenCache();
            idToken.toObject(mappedId);
            idObjects.push(idToken);
            });

        return idObjects;
    }

    /**
     * Deserializes refresh tokens to RefreshTokenCache objects
     * @param refreshTokens
     */
    static deSerializeRefresTokens(refreshTokens: Array<string>): Array<RefreshTokenCache> {
        let rtObjects: Array<RefreshTokenCache> = [];
        refreshTokens.forEach((element: any) => {
            const mappedRT: string = CacheHelper.renameKeys(
                element,
                RefreshTokenCacheMaps.fromCacheMap
            );
            const refreshToken: RefreshTokenCache = new RefreshTokenCache();
            refreshToken.toObject(mappedRT);
            rtObjects.push(refreshToken);
        });

        return rtObjects;
    }

    /**
     * Deserializes accounts to AccountCache objects
     * @param accounts
     */
    static deSerializeAccounts(accounts: Array<string>): Array<AccountCache> {
        let accountObjects: Array<AccountCache> = [];
        accounts.forEach((element: any) => {
            const mappedAc: string = CacheHelper.renameKeys(
                element,
                AccountCacheMaps.fromCacheMap
            );
            const account: AccountCache = new AccountCache();
            account.toObject(mappedAc);
            accountObjects.push(account);
        });

        return accountObjects;
    }

    /**
     * Deserializes appMetadata to AppMetaData objects
     * @param appMetadata
     */
    static deserializeAppMetadata<T>(appMetadata: Array<string>): Array<AppMetadataCache> {
        let appMetadataObjects: Array<AppMetadataCache> = [];
        appMetadata.forEach((element: any) => {
            const mappedAppMetadata: string = CacheHelper.renameKeys(
                element,
                AppMetadataCacheMaps.fromCacheMap
            );
            const appMetadataEntry: AppMetadataCache = new AppMetadataCache();
            appMetadataEntry.toObject(mappedAppMetadata);
            appMetadataObjects.push(appMetadataEntry);
        });

        return appMetadataObjects;
    }
}
