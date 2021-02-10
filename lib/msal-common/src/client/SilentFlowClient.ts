/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ScopeSet } from "../request/ScopeSet";
import { AuthToken } from "../account/AuthToken";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenClient } from "./RefreshTokenClient";
import { ClientAuthError, ClientAuthErrorMessage } from "../error/ClientAuthError";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ResponseHandler } from "../response/ResponseHandler";
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
    async acquireToken(request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        try {
            return await this.acquireCachedToken(request);
        } catch (e) {
            if (e instanceof ClientAuthError && e.errorCode === ClientAuthErrorMessage.tokenRefreshRequired.code) {
                const refreshTokenClient = new RefreshTokenClient(this.config);
                return refreshTokenClient.acquireTokenByRefreshToken(request);
            } else {
                throw e;
            }
        }
    }

    /**
     * Retrieves token from cache or throws an error if it must be refreshed.
     * @param request
     */
    async acquireCachedToken(request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }

        const requestScopes = new ScopeSet(request.scopes || []);
        const environment = request.authority || this.authority.getPreferredCache();
        const cacheRecord = this.cacheManager.readCacheRecord(request.account, this.config.authOptions.clientId, requestScopes, environment);

        if (request.forceRefresh || 
            request.claims || 
            !cacheRecord.accessToken || 
            TimeUtils.isTokenExpired(cacheRecord.accessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds)) {
            // Must refresh due to request parameters, or expired or non-existent access_token
            throw ClientAuthError.createRefreshRequiredError();
        } else if (cacheRecord.accessToken.refreshOn && TimeUtils.isTokenExpired(cacheRecord.accessToken.refreshOn, 0)) {
            // Refresh on time has passed, start token renewal process and return current access token
            const refreshTokenClient = new RefreshTokenClient(this.config);
            refreshTokenClient.acquireTokenByRefreshToken(request);
        }

        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }

        return await this.generateResultFromCacheRecord(cacheRecord, request.resourceRequestMethod, request.resourceRequestUri);
    }

    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    private async generateResultFromCacheRecord(cacheRecord: CacheRecord, resourceRequestMethod?: string, resourceRequestUri?: string): Promise<AuthenticationResult> {
        let idTokenObj: AuthToken | undefined;
        if (cacheRecord.idToken) {
            idTokenObj = new AuthToken(cacheRecord.idToken.secret, this.config.cryptoInterface);
        }
        return await ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.authority,
            cacheRecord,
            true,
            idTokenObj,
            undefined,
            resourceRequestMethod,
            resourceRequestUri
        );
    }
}
