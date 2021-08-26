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
import { AuthenticationScheme } from "../utils/Constants";

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
            const result = await this.acquireCachedToken(request);
            return result;
        } catch (e) {
            if (e instanceof ClientAuthError && e.errorCode === ClientAuthErrorMessage.tokenRefreshRequired.code) {
                const refreshTokenClient = new RefreshTokenClient(this.config);
                const result = refreshTokenClient.acquireTokenByRefreshToken(request);
                return result;
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
        const endMeasurement = this.performanceManager.startMeasurement("silentFlowClient.acquireCachedToken");
        // Cannot renew token if no request object is given.
        if (!request) {
            endMeasurement();
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            endMeasurement();
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }
        const requestScopes = new ScopeSet(request.scopes || []);
        const environment = request.authority || this.authority.getPreferredCache();
        const authScheme = request.authenticationScheme || AuthenticationScheme.BEARER;
        const cacheRecord = this.cacheManager.readCacheRecord(request.account, this.config.authOptions.clientId, requestScopes, environment, authScheme);

        if (request.forceRefresh || 
            request.claims || 
            !cacheRecord.accessToken || 
            TimeUtils.isTokenExpired(cacheRecord.accessToken.expiresOn, this.config.systemOptions.tokenRenewalOffsetSeconds) ||
            (cacheRecord.accessToken.refreshOn && TimeUtils.isTokenExpired(cacheRecord.accessToken.refreshOn, 0))) {
            // Must refresh due to request parameters, or expired or non-existent access_token
            endMeasurement();
            throw ClientAuthError.createRefreshRequiredError();
        }

        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }

        const result = await this.generateResultFromCacheRecord(cacheRecord, request);
        endMeasurement();
        return result;
    }

    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    private async generateResultFromCacheRecord(cacheRecord: CacheRecord, request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        const endMeasurement = this.performanceManager.startMeasurement("silentFlowClient.generateResultFromCacheRecord");
        let idTokenObj: AuthToken | undefined;
        if (cacheRecord.idToken) {
            idTokenObj = new AuthToken(cacheRecord.idToken.secret, this.config.cryptoInterface);
        }
        const result = await ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.performanceManager,
            this.authority,
            cacheRecord,
            true,
            request,
            idTokenObj
        );
        endMeasurement();
        return result;
    }
}
