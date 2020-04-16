/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Deserializer } from "./Deserializer";
import { AccessTokenCache, IdTokenCache, RefreshTokenCache, AccountCache, AppMetadataCache, StringDict } from "../../utils/MsalTypes";

export type CacheContent = {
    accessTokens: StringDict;
    idTokens: StringDict;
    refreshTokens: StringDict;
    accounts: StringDict;
    appMetadata: StringDict;
};

export type CacheJson = {
    AccessToken?: StringDict;
    IdToken?: StringDict;
    RefreshToken?: StringDict;
    Account?: StringDict;
    AppMetadata?: StringDict;
};

export type CacheInMemObjects = {
    accessTokens: AccessTokenCache;
    idTokens: IdTokenCache;
    refreshTokens: RefreshTokenCache;
    accounts: AccountCache;
    appMetadata: AppMetadataCache;
};

export class CacheInterface {

    /**
     * serialize the JSON blob
     * @param data
     */
    static serializeJSONBlob(data: CacheJson): string {
        return JSON.stringify(data);
    }

    /**
     * Parse the JSON blob in memory and deserialize the content
     * @param cachedJson
     */
    static deserializeJSONBlob(jsonFile: string): CacheContent {
        const parsedJSON: CacheJson = JSON.parse(jsonFile);

        const cache: CacheContent = {
            accessTokens: parsedJSON.AccessToken ? parsedJSON.AccessToken : {},
            idTokens: parsedJSON.IdToken ? parsedJSON.IdToken : {},
            refreshTokens: parsedJSON.RefreshToken ? parsedJSON.RefreshToken: {},
            accounts: parsedJSON.Account ? parsedJSON.Account : {},
            appMetadata: parsedJSON.AppMetadata ? parsedJSON.AppMetadata : {},
        };
        return cache;
    }

    /**
     * Generate in memory access token cache
     * @param jsonAT
     */
    static generateAccessTokenCache(jsonAT: StringDict): AccessTokenCache {
        return Deserializer.deSerializeAccessTokens(jsonAT);
    }

    /**
     * Generate in memory id token Cache
     * @param jsonIdT
     */
    static generateIdTokenCache(jsonIdT: StringDict): IdTokenCache {
        return Deserializer.deSerializeIdTokens(jsonIdT);
    }

    /**
     * Generate in memory refresh token cache
     * @param jsonRT
     */
    static generateRefreshTokenCache(jsonRT: StringDict): RefreshTokenCache {
        return Deserializer.deSerializeRefreshTokens(jsonRT);
    }

    /**
     * Generate in memory account cache
     * @param jsonAcc
     */
    static generateAccountCache(jsonAcc: StringDict): AccountCache {
        return Deserializer.deSerializeAccounts(jsonAcc);
    }

    /**
     * Generate in memory appmetadata cache
     * @param jsonAmdt
     */
    static generateAppMetadataCache(jsonAmdt: StringDict): AppMetadataCache {
        return Deserializer.deserializeAppMetadata(jsonAmdt);
    }

}
