/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { CredentialType } from "../utils/Constants";
import { CacheRecord } from "../unifiedCache/entities/CacheRecord";
import { IdTokenEntity } from "../unifiedCache/entities/IdTokenEntity";
import { CacheHelper } from "../unifiedCache/utils/CacheHelper";
import { AccessTokenEntity } from "../unifiedCache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../unifiedCache/entities/RefreshTokenEntity";
import { ScopeSet } from "../request/ScopeSet";
import { IdToken } from "../account/IdToken";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { RefreshTokenClient } from "./RefreshTokenClient";
import { ClientAuthError } from "../error/ClientAuthError";
import { IAccount } from '../account/IAccount';
import { AccountFilter } from '../unifiedCache/utils/CacheTypes';
import { AccountEntity } from '../unifiedCache/entities/AccountEntity';

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

        // We currently do not support silent flow for account===null use cases; This will be revisited for confidential flow usecases
        if (request.account === null) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        } else {

            const userAccount: IAccount = request.account;
            const accountFilter: AccountFilter = {
                homeAccountId: request.account.homeAccountId,
                environment: request.account.environment
            };
            const accountEntity: AccountEntity = this.unifiedCacheManager.getAccountsFilteredBy(accountFilter);

            // fetch account
            cacheRecord.account = this.unifiedCacheManager.getAccount(request.account.generateAccountKey());

            const homeAccountId = cacheRecord.account.homeAccountId;
            const environment = cacheRecord.account.environment;

            // fetch idToken, accessToken, refreshToken
            cacheRecord.idToken = this.fetchIdToken(homeAccountId, environment);
            idTokenObj = new IdToken(cacheRecord.idToken.secret, this.config.cryptoInterface);
            cacheRecord.accessToken = this.fetchAccessToken(homeAccountId, environment, requestScopes);
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
    fetchIdToken(homeAccountId: string, environment: string): IdTokenEntity {
        const idTokenKey: string = CacheHelper.generateCacheKey(
            homeAccountId,
            environment,
            CredentialType.ID_TOKEN,
            this.config.authOptions.clientId,
            this.defaultAuthority.tenant
        );
        return this.unifiedCacheManager.getCredential(idTokenKey) as IdTokenEntity;
    }

    /**
     * fetches accessToken from cache if present
     * @param request
     * @param scopes
     */
    fetchAccessToken(homeAccountId: string, environment: string, scopes: ScopeSet): AccessTokenEntity {
        const accessTokenKey: string = CacheHelper.generateCacheKey(
            homeAccountId,
            environment,
            CredentialType.ACCESS_TOKEN,
            this.config.authOptions.clientId,
            this.defaultAuthority.tenant,
            scopes.printScopes()
        );

        return this.unifiedCacheManager.getCredential(accessTokenKey) as AccessTokenEntity;
    }

    /**
     * fetches refreshToken from cache if present
     * @param request
     */
    fetchRefreshToken(homeAccountId: string, environment: string): RefreshTokenEntity {
        const refreshTokenKey: string = CacheHelper.generateCacheKey(
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
    isTokenExpired(expiresOn: string): boolean {
        // check for access token expiry
        const expirationSec = Number(expiresOn);
        const offsetCurrentTimeSec = TimeUtils.nowSeconds() + this.config.systemOptions.tokenRenewalOffsetSeconds;

        // Check if refresh is forced, or if tokens are expired. If neither are true, return a token response with the found token entry.
        return (expirationSec && expirationSec > offsetCurrentTimeSec);
    }
}
