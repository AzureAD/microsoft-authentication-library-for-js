/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class Serializer {
    /**
     * serialize the JSON blob
     * @param data
     */
    static serializeJSONBlob(data: any): string {
        return JSON.stringify(data);
    }

    /**
     * Serialize Accounts
     * @param accCache
     */
    static serializeAccounts(accCache: any): Record<string, any> {
        const accounts: Record<string, any> = {};
        Object.keys(accCache).map(function (key) {
            const accountEntity = accCache[key];
            accounts[key] = {
                home_account_id: accountEntity.homeAccountId,
                environment: accountEntity.environment,
                realm: accountEntity.realm,
                local_account_id: accountEntity.localAccountId,
                username: accountEntity.username,
                authority_type: accountEntity.authorityType,
                name: accountEntity.name,
                client_info: accountEntity.clientInfo,
                last_modification_time: accountEntity.lastModificationTime,
                last_modification_app: accountEntity.lastModificationApp,
            };
        });

        return accounts;
    }

    /**
     * Serialize IdTokens
     * @param idTCache
     */
    static serializeIdTokens(idTCache: any): Record<string, any> {
        const idTokens: Record<string, any> = {};
        Object.keys(idTCache).map(function (key) {
            const idTEntity = idTCache[key];
            idTokens[key] = {
                home_account_id: idTEntity.homeAccountId,
                environment: idTEntity.environment,
                credential_type: idTEntity.credentialType,
                client_id: idTEntity.clientId,
                secret: idTEntity.secret,
                realm: idTEntity.realm,
            };
        });

        return idTokens;
    }

    /**
     * Serializes AccessTokens
     * @param atCache
     */
    static serializeAccessTokens(atCache: any): Record<string, any> {
        const accessTokens: Record<string, any> = {};
        Object.keys(atCache).map(function (key) {
            const atEntity = atCache[key];
            accessTokens[key] = {
                home_account_id: atEntity.homeAccountId,
                environment: atEntity.environment,
                credential_type: atEntity.credentialType,
                client_id: atEntity.clientId,
                secret: atEntity.secret,
                realm: atEntity.realm,
                target: atEntity.target,
                cached_at: atEntity.cachedAt,
                expires_on: atEntity.expiresOn,
                extended_expires_on: atEntity.extendedExpiresOn,
                refresh_on: atEntity.refreshOn,
                key_id: atEntity.keyId,
                token_type: atEntity.tokenType,
                requestedClaims: atEntity.requestedClaims,
                requestedClaimsHash: atEntity.requestedClaimsHash,
                userAssertionHash: atEntity.userAssertionHash,
            };
        });

        return accessTokens;
    }

    /**
     * Serialize refreshTokens
     * @param rtCache
     */
    static serializeRefreshTokens(rtCache: any): Record<string, any> {
        const refreshTokens: Record<string, any> = {};
        Object.keys(rtCache).map(function (key) {
            const rtEntity = rtCache[key];
            refreshTokens[key] = {
                home_account_id: rtEntity.homeAccountId,
                environment: rtEntity.environment,
                credential_type: rtEntity.credentialType,
                client_id: rtEntity.clientId,
                secret: rtEntity.secret,
                family_id: rtEntity.familyId,
                target: rtEntity.target,
                realm: rtEntity.realm,
            };
        });

        return refreshTokens;
    }

    /**
     * Serialize amdtCache
     * @param amdtCache
     */
    static serializeAppMetadata(amdtCache: any): Record<string, any> {
        const appMetadata: Record<string, any> = {};
        Object.keys(amdtCache).map(function (key) {
            const amdtEntity = amdtCache[key];
            appMetadata[key] = {
                client_id: amdtEntity.clientId,
                environment: amdtEntity.environment,
                family_id: amdtEntity.familyId,
            };
        });

        return appMetadata;
    }

    /**
     * Serialize the cache
     * @param jsonContent
     */
    static serializeAllCache(inMemCache: any): any {
        return {
            Account: this.serializeAccounts(inMemCache.accounts),
            IdToken: this.serializeIdTokens(inMemCache.idTokens),
            AccessToken: this.serializeAccessTokens(inMemCache.accessTokens),
            RefreshToken: this.serializeRefreshTokens(inMemCache.refreshTokens),
            AppMetadata: this.serializeAppMetadata(inMemCache.appMetadata),
        };
    }
}
