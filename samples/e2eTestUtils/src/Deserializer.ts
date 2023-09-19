/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * This class deserializes cache entities read from the file into in memory object types defined internally
 */
export class Deserializer {
    /**
     * Parse the JSON blob in memory and deserialize the content
     * @param cachedJson
     */
    static deserializeJSONBlob(jsonFile: string): any {
        const deserializedCache = !jsonFile ? {} : JSON.parse(jsonFile);
        return deserializedCache;
    }

    static toObject<T>(obj: any, json: any): T {
        for (const propertyName in json) {
            obj[propertyName] = json[propertyName];
        }
        return obj;
    }

    /**
     * Deserializes accounts to AccountEntity objects
     * @param accounts
     */
    static deserializeAccounts(accounts: Record<string, any>): any {
        const accountObjects: any = {};
        if (accounts) {
            Object.keys(accounts).map(function (key) {
                const serializedAcc = accounts[key];
                const mappedAcc = {
                    homeAccountId: serializedAcc.home_account_id,
                    environment: serializedAcc.environment,
                    realm: serializedAcc.realm,
                    localAccountId: serializedAcc.local_account_id,
                    username: serializedAcc.username,
                    authorityType: serializedAcc.authority_type,
                    name: serializedAcc.name,
                    clientInfo: serializedAcc.client_info,
                    lastModificationTime: serializedAcc.last_modification_time,
                    lastModificationApp: serializedAcc.last_modification_app,
                };
                const account = {};
                Deserializer.toObject(account, mappedAcc);
                accountObjects[key] = account;
            });
        }

        return accountObjects;
    }

    /**
     * Deserializes id tokens to IdTokenEntity objects
     * @param idTokens
     */
    static deserializeIdTokens(idTokens: Record<string, any>): any {
        const idObjects: any = {};
        if (idTokens) {
            Object.keys(idTokens).map(function (key) {
                const serializedIdT = idTokens[key];
                const mappedIdT = {
                    homeAccountId: serializedIdT.home_account_id,
                    environment: serializedIdT.environment,
                    credentialType: serializedIdT.credential_type,
                    clientId: serializedIdT.client_id,
                    secret: serializedIdT.secret,
                    realm: serializedIdT.realm,
                };
                const idToken = {};
                Deserializer.toObject(idToken, mappedIdT);
                idObjects[key] = idToken;
            });
        }
        return idObjects;
    }

    /**
     * Deserializes access tokens to AccessTokenEntity objects
     * @param accessTokens
     */
    static deserializeAccessTokens(accessTokens: Record<string, any>): any {
        const atObjects: any = {};
        if (accessTokens) {
            Object.keys(accessTokens).map(function (key) {
                const serializedAT = accessTokens[key];
                const mappedAT = {
                    homeAccountId: serializedAT.home_account_id,
                    environment: serializedAT.environment,
                    credentialType: serializedAT.credential_type,
                    clientId: serializedAT.client_id,
                    secret: serializedAT.secret,
                    realm: serializedAT.realm,
                    target: serializedAT.target,
                    cachedAt: serializedAT.cached_at,
                    expiresOn: serializedAT.expires_on,
                    extendedExpiresOn: serializedAT.extended_expires_on,
                    refreshOn: serializedAT.refresh_on,
                    keyId: serializedAT.key_id,
                    tokenType: serializedAT.token_type,
                    requestedClaims: serializedAT.requestedClaims,
                    requestedClaimsHash: serializedAT.requestedClaimsHash,
                    userAssertionHash: serializedAT.userAssertionHash,
                };
                const accessToken: any = {};
                Deserializer.toObject(accessToken, mappedAT);
                atObjects[key] = accessToken;
            });
        }

        return atObjects;
    }

    /**
     * Deserializes refresh tokens to RefreshTokenEntity objects
     * @param refreshTokens
     */
    static deserializeRefreshTokens(refreshTokens: Record<string, any>): any {
        const rtObjects: any = {};
        if (refreshTokens) {
            Object.keys(refreshTokens).map(function (key) {
                const serializedRT = refreshTokens[key];
                const mappedRT = {
                    homeAccountId: serializedRT.home_account_id,
                    environment: serializedRT.environment,
                    credentialType: serializedRT.credential_type,
                    clientId: serializedRT.client_id,
                    secret: serializedRT.secret,
                    familyId: serializedRT.family_id,
                    target: serializedRT.target,
                    realm: serializedRT.realm,
                };
                const refreshToken = {};
                Deserializer.toObject(refreshToken, mappedRT);
                rtObjects[key] = refreshToken;
            });
        }

        return rtObjects;
    }

    /**
     * Deserializes appMetadata to AppMetaData objects
     * @param appMetadata
     */
    static deserializeAppMetadata(appMetadata: Record<string, any>): any {
        const appMetadataObjects: any = {};
        if (appMetadata) {
            Object.keys(appMetadata).map(function (key) {
                const serializedAmdt = appMetadata[key];
                const mappedAmd = {
                    clientId: serializedAmdt.client_id,
                    environment: serializedAmdt.environment,
                    familyId: serializedAmdt.family_id,
                };
                const amd = {};
                Deserializer.toObject(amd, mappedAmd);
                appMetadataObjects[key] = amd;
            });
        }

        return appMetadataObjects;
    }

    /**
     * Deserialize an inMemory Cache
     * @param jsonCache
     */
    static deserializeAllCache(jsonCache: any): any {
        return {
            accounts: jsonCache.Account
                ? this.deserializeAccounts(jsonCache.Account)
                : {},
            idTokens: jsonCache.IdToken
                ? this.deserializeIdTokens(jsonCache.IdToken)
                : {},
            accessTokens: jsonCache.AccessToken
                ? this.deserializeAccessTokens(jsonCache.AccessToken)
                : {},
            refreshTokens: jsonCache.RefreshToken
                ? this.deserializeRefreshTokens(jsonCache.RefreshToken)
                : {},
            appMetadata: jsonCache.AppMetadata
                ? this.deserializeAppMetadata(jsonCache.AppMetadata)
                : {},
        };
    }
}
