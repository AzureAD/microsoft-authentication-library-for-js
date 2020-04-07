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

// TODO: Can we write generalized code for this with Generics?
export class Deserializer {
    /**
     * Deserializes access tokens to AccessTokenEntity objects
     * @param accessTokens
     */
    static deSerializeAccessTokens(accessTokens: Array<string>): Array<AccessTokenEntity> {
        const atObjects: Array<AccessTokenEntity> = [];
        Array.prototype.forEach.call(accessTokens, (element: string) => {
            const mappedAT: string = CacheHelper.renameKeys(
                element,
                AccessTokenCacheMaps.fromCacheMap
            );
            const accessToken: AccessTokenEntity = new AccessTokenEntity();
            accessToken.toObject(mappedAT);
            atObjects.push(accessToken);
        });

        return atObjects;
    }

    /**
     * Deserializes id tokens to IdTokenEntity objects
     * @param idTokens
     */
    static deSerializeIdTokens(idTokens: Array<string>): Array<IdTokenEntity> {
        const idObjects: Array<IdTokenEntity> = [];
        idTokens.forEach((element: string) => {
            const mappedId: string = CacheHelper.renameKeys(
                element,
                IdTokenCacheMaps.fromCacheMap
            );
            const idToken: IdTokenEntity = new IdTokenEntity();
            idToken.toObject(mappedId);
            idObjects.push(idToken);
        });

        return idObjects;
    }

    /**
     * Deserializes refresh tokens to RefreshTokenEntity objects
     * @param refreshTokens
     */
    static deSerializeRefreshTokens(refreshTokens: Array<string>): Array<RefreshTokenEntity> {
        const rtObjects: Array<RefreshTokenEntity> = [];
        refreshTokens.forEach((element: string) => {
            const mappedRT: string = CacheHelper.renameKeys(
                element,
                RefreshTokenCacheMaps.fromCacheMap
            );
            const refreshToken: RefreshTokenEntity = new RefreshTokenEntity();
            refreshToken.toObject(mappedRT);
            rtObjects.push(refreshToken);
        });

        return rtObjects;
    }

    /**
     * Deserializes accounts to AccountEntity objects
     * @param accounts
     */
    static deSerializeAccounts(accounts: Array<string>): Array<AccountEntity> {
        const accountObjects: Array<AccountEntity> = [];
        accounts.forEach((element: string) => {
            const mappedAc: string = CacheHelper.renameKeys(
                element,
                AccountCacheMaps.fromCacheMap
            );
            const account: AccountEntity = new AccountEntity();
            account.toObject(mappedAc);
            accountObjects.push(account);
        });

        return accountObjects;
    }

    /**
     * Deserializes appMetadata to AppMetaData objects
     * @param appMetadata
     */
    static deserializeAppMetadata(appMetadata: Array<string>): Array<AppMetadataEntity> {
        const appMetadataObjects: Array<AppMetadataEntity> = [];
        appMetadata.forEach((element: string) => {
            const mappedAppMetadata: string = CacheHelper.renameKeys(
                element,
                AppMetadataCacheMaps.fromCacheMap
            );
            const appMetadataEntry: AppMetadataEntity = new AppMetadataEntity();
            appMetadataEntry.toObject(mappedAppMetadata);
            appMetadataObjects.push(appMetadataEntry);
        });

        return appMetadataObjects;
    }
}
