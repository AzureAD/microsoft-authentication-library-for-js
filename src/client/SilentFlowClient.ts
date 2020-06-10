/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { CredentialType } from "../utils/Constants";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { CacheHelper } from "../cache/utils/CacheHelper";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import { ScopeSet } from "../request/ScopeSet";
import { IdToken } from "../account/IdToken";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { RefreshTokenClient } from "./RefreshTokenClient";
import { ClientAuthError } from "../error/ClientAuthError";
import { CredentialFilter, CredentialCache } from "../cache/utils/CacheTypes";

export class SilentFlowClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token
     * @param request
     */
    public async acquireToken(request: SilentFlowRequest): Promise<AuthenticationResult>{
        let cacheRecord: CacheRecord;
        let idTokenObj: IdToken;
        const requestScopes = new ScopeSet(request.scopes || [], this.config.authOptions.clientId, true);

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (request.account === null) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        } else {
            cacheRecord = new CacheRecord();
            // fetch account
            const accountKey: string = CacheHelper.generateAccountCacheKey(request.account);
            cacheRecord.account = this.unifiedCacheManager.getAccount(accountKey);

            const homeAccountId = cacheRecord.account.homeAccountId;
            const environment = cacheRecord.account.environment;

            // fetch idToken, accessToken, refreshToken
            cacheRecord.idToken = this.fetchIdToken(homeAccountId, environment, cacheRecord.account.realm);
            idTokenObj = new IdToken(cacheRecord.idToken.secret, this.config.cryptoInterface);
            cacheRecord.accessToken = this.fetchAccessToken(homeAccountId, environment, requestScopes, cacheRecord.account.realm);
            cacheRecord.refreshToken = this.fetchRefreshToken(homeAccountId, environment);

            // If accessToken has expired, call refreshToken flow to fetch a new set of tokens
            if (request.forceRefresh || (!!cacheRecord.accessToken && this.isTokenExpired(cacheRecord.accessToken.expiresOn))) {
                // check if we have refreshToken
                if (!!cacheRecord.refreshToken) {
                    const refreshTokenClient = new RefreshTokenClient(this.config);
                    const refreshTokenRequest: RefreshTokenRequest = {
                        scopes: request.scopes,
                        refreshToken: cacheRecord.refreshToken.secret,
                        authority: request.authority
                    };

                    return refreshTokenClient.acquireToken(refreshTokenRequest);
                }
                // no refresh Token
                else {
                    throw ClientAuthError.createNoTokenInCacheError();
                }
            }

            if (cacheRecord.accessToken === null) {
                throw ClientAuthError.createNoTokenInCacheError();
            }
        }

        // generate Authentication Result
        return {
            uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
            tenantId: idTokenObj.claims.tid,
            scopes: requestScopes.asArray(),
            account: CacheHelper.toIAccount(cacheRecord.account),
            idToken: cacheRecord.idToken.secret,
            idTokenClaims: idTokenObj.claims,
            accessToken: cacheRecord.accessToken.secret,
            expiresOn: new Date(cacheRecord.accessToken.expiresOn),
            extExpiresOn: new Date(cacheRecord.accessToken.extendedExpiresOn),
            familyId: null,
        };
    }

    /**
     * fetches idToken from cache if present
     * @param request
     */
    private fetchIdToken(homeAccountId: string, environment: string, inputRealm: string): IdTokenEntity {
        const idTokenKey: string = CacheHelper.generateCredentialCacheKey(
            homeAccountId,
            environment,
            CredentialType.ID_TOKEN,
            this.config.authOptions.clientId,
            inputRealm
        );
        return this.unifiedCacheManager.getCredential(idTokenKey) as IdTokenEntity;
    }

    /**
     * fetches accessToken from cache if present
     * @param request
     * @param scopes
     */
    private fetchAccessToken(homeAccountId: string, environment: string, scopes: ScopeSet, inputRealm: string): AccessTokenEntity {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId,
            environment,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: inputRealm,
            target: scopes.printScopes()
        };
        const credentialCache: CredentialCache = this.unifiedCacheManager.getCredentialsFilteredBy(accessTokenFilter);
        const accessTokens = Object.values(credentialCache);
        if (accessTokens.length > 1) {
            // TODO: Figure out what to throw or return here.
        } else if (accessTokens.length < 1) {
            return null;
        }
        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * fetches refreshToken from cache if present
     * @param request
     */
    private fetchRefreshToken(homeAccountId: string, environment: string): RefreshTokenEntity {
        const refreshTokenKey: string = CacheHelper.generateCredentialCacheKey(
            homeAccountId,
            environment,
            CredentialType.REFRESH_TOKEN,
            this.config.authOptions.clientId
        );
        return this.unifiedCacheManager.getCredential(refreshTokenKey) as RefreshTokenEntity;
    }

    /**
     * check if an access token is expired
     * @param expiresOn
     */
    private isTokenExpired(expiresOn: string): boolean {
        // check for access token expiry
        let expirationSec = Number(expiresOn);
        const offsetCurrentTimeSec = TimeUtils.nowSeconds() + this.config.systemOptions.tokenRenewalOffsetSeconds;

        // Check if refresh is forced, or if tokens are expired. If neither are true, return a token response with the found token entry.
        if (!expirationSec) {
            expirationSec = 0;
        }
        return (expirationSec > offsetCurrentTimeSec);
    }
}
