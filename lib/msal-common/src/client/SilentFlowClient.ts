/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { ScopeSet } from "../request/ScopeSet";
import { IdToken } from "../account/IdToken";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { RefreshTokenClient } from "./RefreshTokenClient";
import { ClientAuthError } from "../error/ClientAuthError";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ResponseHandler } from "../response/ResponseHandler";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import { CacheRecord } from "../cache/entities/CacheRecord";

export class SilentFlowClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token
     * @param request
     */
    public async acquireToken(request: SilentFlowRequest): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }
        
        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        } 

        const requestScopes = new ScopeSet(request.scopes || []);
        const cacheRecord = this.cacheManager.getCacheRecord(request.account, this.config.authOptions.clientId, requestScopes);

        // Check if refresh is forced, claims are being requested or if tokens are expired. If neither are true, return a token response with the found token entry.
        if (this.isRefreshRequired(request, cacheRecord.accessToken)) {
            return this.refreshToken(request, cacheRecord.refreshToken);
        } else {
            return this.generateResultFromCacheRecord(cacheRecord);
        }
    }

    private refreshToken(request: SilentFlowRequest, refreshToken: RefreshTokenEntity): Promise<AuthenticationResult> {
        // no refresh Token
        if (!refreshToken) {
            throw ClientAuthError.createNoTokensFoundError();
        }

        const refreshTokenClient = new RefreshTokenClient(this.config);
        const refreshTokenRequest: RefreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret
        };

        return refreshTokenClient.acquireToken(refreshTokenRequest);
    }

    private generateResultFromCacheRecord(cacheRecord: CacheRecord): AuthenticationResult {
        // Return tokens from cache
        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }
        const idTokenObj = new IdToken(cacheRecord.idToken.secret, this.config.cryptoInterface);

        return ResponseHandler.generateAuthenticationResult(cacheRecord, idTokenObj, true);
    }

    private isRefreshRequired(request: SilentFlowRequest, cachedAccessToken: AccessTokenEntity|null): boolean {
        if (request.forceRefresh || request.claims) {
            // Must refresh due to request parameters
            return true;
        } else if (!cachedAccessToken || TimeUtils.isTokenExpired(cachedAccessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
            // Must refresh due to expired or non-existent access_token
            return true;
        }

        return false;
    }
}
