/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { AuthToken } from "../account/AuthToken";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenClient } from "./RefreshTokenClient";
import {
    ClientAuthError,
    ClientAuthErrorMessage,
} from "../error/ClientAuthError";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ResponseHandler } from "../response/ResponseHandler";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { CacheOutcome } from "../utils/Constants";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { StringUtils } from "../utils/StringUtils";

/** @internal */
export class SilentFlowClient extends BaseClient {
    private lastCacheOutcome: CacheOutcome;

    constructor(
        configuration: ClientConfiguration,
        performanceClient?: IPerformanceClient
    ) {
        super(configuration, performanceClient);
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token
     * @param request
     */
    async acquireToken(
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        try {
            const cachedToken = await this.acquireCachedToken(request);

            // if the token is not expired but must be refreshed; get a new one in the background
            if (
                this.lastCacheOutcome ===
                CacheOutcome.REFRESH_CACHED_ACCESS_TOKEN
            ) {
                this.logger.info(
                    "SilentFlowClient:acquireCachedToken - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed."
                );

                // refresh the access token in the background
                const refreshTokenClient = new RefreshTokenClient(
                    this.config,
                    this.performanceClient
                );
                refreshTokenClient.acquireTokenByRefreshToken(request);
            }

            // reset the last cache outcome
            this.lastCacheOutcome = CacheOutcome.NO_CACHE_HIT;

            // return the cached token
            return cachedToken;

        } catch (e) {
            // reset the last cache outcome
            this.lastCacheOutcome = CacheOutcome.NO_CACHE_HIT;

            if (
                e instanceof ClientAuthError &&
                e.errorCode === ClientAuthErrorMessage.tokenRefreshRequired.code
            ) {
                const refreshTokenClient = new RefreshTokenClient(
                    this.config,
                    this.performanceClient
                );
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
    async acquireCachedToken(
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        if (request.forceRefresh) {
            // Must refresh due to present force_refresh flag.
            this.lastCacheOutcome = CacheOutcome.FORCE_REFRESH;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.FORCE_REFRESH
            );
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - Skipping cache because forceRefresh is true."
            );
            throw ClientAuthError.createRefreshRequiredError();
        } else if (
            !this.config.cacheOptions.claimsBasedCachingEnabled &&
            !StringUtils.isEmptyObj(request.claims)
        ) {
            // Must refresh due to request parameters.
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - Skipping cache because claims-based caching is disabled and claims were requested."
            );
            throw ClientAuthError.createRefreshRequiredError();
        }

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }

        const environment =
            request.authority || this.authority.getPreferredCache();

        const cacheRecord = this.cacheManager.readCacheRecord(
            request.account,
            request,
            environment
        );

        if (!cacheRecord.accessToken) {
            // must refresh due to non-existent access_token
            this.lastCacheOutcome = CacheOutcome.NO_CACHED_ACCESS_TOKEN;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.NO_CACHED_ACCESS_TOKEN
            );
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - No access token found in cache for the given properties."
            );
            throw ClientAuthError.createRefreshRequiredError();
        } else if (
            TimeUtils.wasClockTurnedBack(cacheRecord.accessToken.cachedAt) ||
            TimeUtils.isTokenExpired(
                cacheRecord.accessToken.expiresOn,
                this.config.systemOptions.tokenRenewalOffsetSeconds
            )
        ) {
            // must refresh due to the expires_in value
            this.lastCacheOutcome = CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED
            );
            this.logger.info(
                `SilentFlowClient:acquireCachedToken - Cached access token is expired or will expire within ${this.config.systemOptions.tokenRenewalOffsetSeconds} seconds.`
            );
            throw ClientAuthError.createRefreshRequiredError();
        } else if (
            cacheRecord.accessToken.refreshOn &&
            TimeUtils.isTokenExpired(cacheRecord.accessToken.refreshOn, 0)
        ) {
            // must refresh (in the background) due to the refresh_in value
            this.lastCacheOutcome = CacheOutcome.REFRESH_CACHED_ACCESS_TOKEN;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.REFRESH_CACHED_ACCESS_TOKEN
            );
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - Cached access token's refreshOn property has been exceeded'."
            );

            // don't throw ClientAuthError.createRefreshRequiredError(), return cached token instead
        }

        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }

        return await this.generateResultFromCacheRecord(cacheRecord, request);
    }

    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    private async generateResultFromCacheRecord(
        cacheRecord: CacheRecord,
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        let idTokenObj: AuthToken | undefined;
        if (cacheRecord.idToken) {
            idTokenObj = new AuthToken(
                cacheRecord.idToken.secret,
                this.config.cryptoInterface
            );
        }

        // token max_age check
        if (request.maxAge || request.maxAge === 0) {
            const authTime = idTokenObj?.claims.auth_time;
            if (!authTime) {
                throw ClientAuthError.createAuthTimeNotFoundError();
            }

            AuthToken.checkMaxAge(authTime, request.maxAge);
        }

        return await ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.authority,
            cacheRecord,
            true,
            request,
            idTokenObj
        );
    }
}
