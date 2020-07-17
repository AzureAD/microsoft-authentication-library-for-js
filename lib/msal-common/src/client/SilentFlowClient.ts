/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { CredentialType } from "../utils/Constants";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import { ScopeSet } from "../request/ScopeSet";
import { IdToken } from "../account/IdToken";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { RefreshTokenClient } from "./RefreshTokenClient";
import { ClientAuthError } from "../error/ClientAuthError";
import { CredentialFilter, CredentialCache } from "../cache/utils/CacheTypes";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { CredentialEntity } from "../cache/entities/CredentialEntity";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ResponseHandler } from "../response/ResponseHandler";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager";

export class SilentFlowClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token
     * @param request
     */
    public async acquireToken(request: SilentFlowRequest, telemetryManager?: ServerTelemetryManager): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }
        
        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        } 

        const requestScopes = new ScopeSet(request.scopes || []);
    
        // Get account object for this request.
        const accountKey: string = AccountEntity.generateAccountCacheKey(request.account);
        const cachedAccount = this.cacheManager.getAccount(accountKey);

        const homeAccountId = cachedAccount.homeAccountId;
        const environment = cachedAccount.environment;

        // Get current cached tokens
        const cachedAccessToken = this.readAccessTokenFromCache(homeAccountId, environment, requestScopes, cachedAccount.realm);
        const cachedRefreshToken = this.readRefreshTokenFromCache(homeAccountId, environment);

        // Check if refresh is forced, or if tokens are expired. If neither are true, return a token response with the found token entry.
        if (request.forceRefresh || !cachedAccessToken || this.isTokenExpired(cachedAccessToken.expiresOn)) {
            // no refresh Token
            if (!cachedRefreshToken) {
                throw ClientAuthError.createNoTokensFoundError();
            }

            const refreshTokenClient = new RefreshTokenClient(this.config);
            const refreshTokenRequest: RefreshTokenRequest = {
                ...request,
                refreshToken: cachedRefreshToken.secret
            };

            return refreshTokenClient.acquireToken(refreshTokenRequest, telemetryManager);
        }

        // Return tokens from cache
        telemetryManager.incrementCacheHits();
        const cachedIdToken = this.readIdTokenFromCache(homeAccountId, environment, cachedAccount.realm);
        const idTokenObj = new IdToken(cachedIdToken.secret, this.config.cryptoInterface);

        return ResponseHandler.generateAuthenticationResult({
            account: cachedAccount,
            accessToken: cachedAccessToken,
            idToken: cachedIdToken,
            refreshToken: cachedRefreshToken
        }, idTokenObj, true);
    }

    /**
     * fetches idToken from cache if present
     * @param request
     */
    private readIdTokenFromCache(homeAccountId: string, environment: string, inputRealm: string): IdTokenEntity {
        const idTokenKey: string = CredentialEntity.generateCredentialCacheKey(
            homeAccountId,
            environment,
            CredentialType.ID_TOKEN,
            this.config.authOptions.clientId,
            inputRealm
        );
        return this.cacheManager.getCredential(idTokenKey) as IdTokenEntity;
    }

    /**
     * fetches accessToken from cache if present
     * @param request
     * @param scopes
     */
    private readAccessTokenFromCache(homeAccountId: string, environment: string, scopes: ScopeSet, inputRealm: string): AccessTokenEntity {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId,
            environment,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: inputRealm,
            target: scopes.printScopes()
        };
        const credentialCache: CredentialCache = this.cacheManager.getCredentialsFilteredBy(accessTokenFilter);
        const accessTokens = Object.keys(credentialCache.accessTokens).map(key => credentialCache.accessTokens[key]);
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
    private readRefreshTokenFromCache(homeAccountId: string, environment: string): RefreshTokenEntity {
        const refreshTokenKey: string = CredentialEntity.generateCredentialCacheKey(
            homeAccountId,
            environment,
            CredentialType.REFRESH_TOKEN,
            this.config.authOptions.clientId
        );
        return this.cacheManager.getCredential(refreshTokenKey) as RefreshTokenEntity;
    }

    /**
     * check if a token is expired based on given UTC time in seconds.
     * @param expiresOn
     */
    private isTokenExpired(expiresOn: string): boolean {
        // check for access token expiry
        const expirationSec = Number(expiresOn) || 0;
        const offsetCurrentTimeSec = TimeUtils.nowSeconds() + this.config.systemOptions.tokenRenewalOffsetSeconds;

        // If current time + offset is greater than token expiration time, then token is expired.
        return (offsetCurrentTimeSec > expirationSec);
    }
}
