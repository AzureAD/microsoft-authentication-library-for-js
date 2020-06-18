/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EntitySerializer } from "./EntitySerializer";
import { StringDict, AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache } from "@azure/msal-common";
import { InMemoryCache, JsonCache } from "./SerializerTypes";

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
        const accounts: StringDict = {};
        Object.keys(accCache).map(function (key) {
            accounts[key] = JSON.stringify(EntitySerializer.mapAccountKeys(accCache, key));
        });

        return accounts;
    }

    /**
     * Serialize IdTokens
     * @param idTCache
     */
    static serializeIdTokens(idTCache: IdTokenCache): StringDict{
        const idTokens: StringDict = {};
        Object.keys(idTCache).map(function (key) {
            idTokens[key] = JSON.stringify(EntitySerializer.mapIdTokenKeys(idTCache, key));
        });

        return idTokens;
    }

    /**
     * Serializes AccessTokens
     * @param atCache
     */
    static serializeAccessTokens(atCache: AccessTokenCache): StringDict {
        const accessTokens: StringDict = {};
        Object.keys(atCache).map(function (key) {
            accessTokens[key] = JSON.stringify(EntitySerializer.mapAccessTokenKeys(atCache, key));
        });

        return accessTokens;
    }

    /**
     * Serialize refreshTokens
     * @param rtCache
     */
    static serializeRefreshTokens(rtCache: RefreshTokenCache): StringDict {
        const refreshTokens: StringDict = {};
        Object.keys(rtCache).map(function (key) {
            refreshTokens[key] = JSON.stringify(EntitySerializer.mapRefreshTokenKeys(rtCache, key));
        });

        return refreshTokens;
    }

    /**
     * Serialize amdtCache
     * @param amdtCache
     */
    static serializeAppMetadata(amdtCache: AppMetadataCache): StringDict {
        const appMetadata: StringDict = {};
        Object.keys(amdtCache).map(function (key) {
            appMetadata[key] = JSON.stringify(EntitySerializer.mapAppMetadataKeys(amdtCache, key));
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
