/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { TimeUtils } from "../utils/TimeUtils";
import { RefreshTokenClient } from "./RefreshTokenClient";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError";
import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError";
import { ResponseHandler } from "../response/ResponseHandler";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { CacheOutcome } from "../utils/Constants";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { StringUtils } from "../utils/StringUtils";
import { checkMaxAge, extractTokenClaims } from "../account/AuthToken";
import { TokenClaims } from "../account/TokenClaims";

/** @internal */
export class SilentFlowClient extends BaseClient {
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
            const [authResponse, cacheOutcome] = await this.acquireCachedToken(
                request
            );

            // if the token is not expired but must be refreshed; get a new one in the background
            if (cacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                this.logger.info(
                    "SilentFlowClient:acquireCachedToken - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed."
                );

                // refresh the access token in the background
                const refreshTokenClient = new RefreshTokenClient(
                    this.config,
                    this.performanceClient
                );

                refreshTokenClient
                    .acquireTokenByRefreshToken(request)
                    .catch(() => {
                        // do nothing, this is running in the background and no action is to be taken upon success or failure
                    });
            }

            // return the cached token
            return authResponse;
        } catch (e) {
            if (
                e instanceof ClientAuthError &&
                e.errorCode === ClientAuthErrorCodes.tokenRefreshRequired
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
    ): Promise<[AuthenticationResult, CacheOutcome]> {
        let lastCacheOutcome: CacheOutcome = CacheOutcome.NOT_APPLICABLE;

        // Cannot renew token if no request object is given.
        if (!request) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.tokenRequestEmpty
            );
        }

        if (request.forceRefresh) {
            // Must refresh due to present force_refresh flag.
            lastCacheOutcome = CacheOutcome.FORCE_REFRESH_OR_CLAIMS;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.FORCE_REFRESH_OR_CLAIMS
            );
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - Skipping cache because forceRefresh is true."
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        } else if (
            !this.config.cacheOptions.claimsBasedCachingEnabled &&
            !StringUtils.isEmptyObj(request.claims)
        ) {
            lastCacheOutcome = CacheOutcome.FORCE_REFRESH_OR_CLAIMS;
            // Must refresh due to request parameters.
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - Skipping cache because claims-based caching is disabled and claims were requested."
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        }

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw createClientAuthError(
                ClientAuthErrorCodes.noAccountInSilentRequest
            );
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
            lastCacheOutcome = CacheOutcome.NO_CACHED_ACCESS_TOKEN;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.NO_CACHED_ACCESS_TOKEN
            );
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - No access token found in cache for the given properties."
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        } else if (
            TimeUtils.wasClockTurnedBack(cacheRecord.accessToken.cachedAt) ||
            TimeUtils.isTokenExpired(
                cacheRecord.accessToken.expiresOn,
                this.config.systemOptions.tokenRenewalOffsetSeconds
            )
        ) {
            // must refresh due to the expires_in value
            lastCacheOutcome = CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED
            );
            this.logger.info(
                `SilentFlowClient:acquireCachedToken - Cached access token is expired or will expire within ${this.config.systemOptions.tokenRenewalOffsetSeconds} seconds.`
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        } else if (
            cacheRecord.accessToken.refreshOn &&
            TimeUtils.isTokenExpired(cacheRecord.accessToken.refreshOn, 0)
        ) {
            // must refresh (in the background) due to the refresh_in value
            lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.PROACTIVELY_REFRESHED
            );
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - Cached access token's refreshOn property has been exceeded'."
            );

            // don't throw ClientAuthError.createRefreshRequiredError(), return cached token instead
        }

        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }

        return [
            await this.generateResultFromCacheRecord(cacheRecord, request),
            lastCacheOutcome,
        ];
    }

    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    private async generateResultFromCacheRecord(
        cacheRecord: CacheRecord,
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        let idTokenClaims: TokenClaims | undefined;
        if (cacheRecord.idToken) {
            idTokenClaims = extractTokenClaims(
                cacheRecord.idToken.secret,
                this.config.cryptoInterface.base64Decode
            );
        }

        // token max_age check
        if (request.maxAge || request.maxAge === 0) {
            const authTime = idTokenClaims?.auth_time;
            if (!authTime) {
                throw createClientAuthError(
                    ClientAuthErrorCodes.authTimeNotFound
                );
            }

            checkMaxAge(authTime, request.maxAge);
        }

        return await ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.authority,
            cacheRecord,
            true,
            request,
            idTokenClaims
        );
    }
}
