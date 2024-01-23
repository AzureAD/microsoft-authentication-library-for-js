/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import * as TimeUtils from "../utils/TimeUtils";
import { RefreshTokenClient } from "./RefreshTokenClient";
import {
    ClientAuthError,
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError";
import { ResponseHandler } from "../response/ResponseHandler";
import { CacheRecord } from "../cache/entities/CacheRecord";
import { CacheOutcome } from "../utils/Constants";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { StringUtils } from "../utils/StringUtils";
import { checkMaxAge, extractTokenClaims } from "../account/AuthToken";
import { TokenClaims } from "../account/TokenClaims";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent";
import { invokeAsync } from "../utils/FunctionWrappers";
import { getTenantFromAuthorityString } from "../authority/Authority";

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
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.SilentFlowClientAcquireCachedToken,
            request.correlationId
        );
        let lastCacheOutcome: CacheOutcome = CacheOutcome.NOT_APPLICABLE;

        if (
            request.forceRefresh ||
            (!this.config.cacheOptions.claimsBasedCachingEnabled &&
                !StringUtils.isEmptyObj(request.claims))
        ) {
            // Must refresh due to present force_refresh flag.
            this.setCacheOutcome(
                CacheOutcome.FORCE_REFRESH_OR_CLAIMS,
                request.correlationId
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

        const requestTenantId =
            request.account.tenantId ||
            getTenantFromAuthorityString(request.authority);
        const tokenKeys = this.cacheManager.getTokenKeys();
        const cachedAccessToken = this.cacheManager.getAccessToken(
            request.account,
            request,
            tokenKeys,
            requestTenantId,
            this.performanceClient,
            request.correlationId
        );

        if (!cachedAccessToken) {
            // must refresh due to non-existent access_token
            this.setCacheOutcome(
                CacheOutcome.NO_CACHED_ACCESS_TOKEN,
                request.correlationId
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        } else if (
            TimeUtils.wasClockTurnedBack(cachedAccessToken.cachedAt) ||
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                this.config.systemOptions.tokenRenewalOffsetSeconds
            )
        ) {
            // must refresh due to the expires_in value
            this.setCacheOutcome(
                CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED,
                request.correlationId
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        } else if (
            cachedAccessToken.refreshOn &&
            TimeUtils.isTokenExpired(cachedAccessToken.refreshOn, 0)
        ) {
            // must refresh (in the background) due to the refresh_in value
            lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;

            // don't throw ClientAuthError.createRefreshRequiredError(), return cached token instead
        }

        const environment =
            request.authority || this.authority.getPreferredCache();
        const cacheRecord: CacheRecord = {
            account: this.cacheManager.readAccountFromCache(request.account),
            accessToken: cachedAccessToken,
            idToken: this.cacheManager.getIdToken(
                request.account,
                tokenKeys,
                requestTenantId,
                this.performanceClient,
                request.correlationId
            ),
            refreshToken: null,
            appMetadata:
                this.cacheManager.readAppMetadataFromCache(environment),
        };

        this.setCacheOutcome(lastCacheOutcome, request.correlationId);

        if (this.config.serverTelemetryManager) {
            this.config.serverTelemetryManager.incrementCacheHits();
        }

        return [
            await invokeAsync(
                this.generateResultFromCacheRecord.bind(this),
                PerformanceEvents.SilentFlowClientGenerateResultFromCacheRecord,
                this.logger,
                this.performanceClient,
                request.correlationId
            )(cacheRecord, request),
            lastCacheOutcome,
        ];
    }

    private setCacheOutcome(
        cacheOutcome: CacheOutcome,
        correlationId: string
    ): void {
        this.serverTelemetryManager?.setCacheOutcome(cacheOutcome);
        this.performanceClient?.addFields(
            {
                cacheOutcome: cacheOutcome,
            },
            correlationId
        );
        if (cacheOutcome !== CacheOutcome.NOT_APPLICABLE) {
            this.logger.info(
                `Token refresh is required due to cache outcome: ${cacheOutcome}`
            );
        }
    }

    /**
     * Helper function to build response object from the CacheRecord
     * @param cacheRecord
     */
    private async generateResultFromCacheRecord(
        cacheRecord: CacheRecord,
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.SilentFlowClientGenerateResultFromCacheRecord,
            request.correlationId
        );
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

        return ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.authority,
            cacheRecord,
            true,
            request,
            idTokenClaims
        );
    }
}
