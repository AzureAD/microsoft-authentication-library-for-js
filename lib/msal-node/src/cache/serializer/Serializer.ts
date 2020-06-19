/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EntitySerializer } from "./EntitySerializer";
import { AccountCache, IdTokenCache, AccessTokenCache, RefreshTokenCache, AppMetadataCache } from "@azure/msal-common";
import { InMemoryCache, JsonCache, Dict } from "./SerializerTypes";

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
    static serializeAccounts(accCache: AccountCache): Dict {
        const accounts: Dict = {};
        Object.keys(accCache).map(function (key) {
            accounts[key] = EntitySerializer.mapAccountKeys(accCache, key);
        });

        return accounts;
    }

    /**
     * Serialize IdTokens
     * @param idTCache
     */
    static serializeIdTokens(idTCache: IdTokenCache): Dict{
        const idTokens: Dict = {};
        Object.keys(idTCache).map(function (key) {
            idTokens[key] = EntitySerializer.mapIdTokenKeys(idTCache, key);
        });

        return idTokens;
    }

    /**
     * Serializes AccessTokens
     * @param atCache
     */
    static serializeAccessTokens(atCache: AccessTokenCache): Dict {
        const accessTokens: Dict = {};
        Object.keys(atCache).map(function (key) {
            accessTokens[key] = EntitySerializer.mapAccessTokenKeys(atCache, key);
        });

        return accessTokens;
    }

    /**
     * Serialize refreshTokens
     * @param rtCache
     */
    static serializeRefreshTokens(rtCache: RefreshTokenCache): Dict {
        const refreshTokens: Dict = {};
        Object.keys(rtCache).map(function (key) {
            refreshTokens[key] = EntitySerializer.mapRefreshTokenKeys(rtCache, key);
        });

        return refreshTokens;
    }

    /**
     * Serialize amdtCache
     * @param amdtCache
     */
    static serializeAppMetadata(amdtCache: AppMetadataCache): Dict {
        const appMetadata: Dict = {};
        Object.keys(amdtCache).map(function (key) {
            appMetadata[key] = EntitySerializer.mapAppMetadataKeys(amdtCache, key);
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
