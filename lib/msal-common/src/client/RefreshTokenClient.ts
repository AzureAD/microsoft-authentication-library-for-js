/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfiguration,
    isOidcProtocolMode,
} from "../config/ClientConfiguration.js";
import { BaseClient } from "./BaseClient.js";
import { CommonRefreshTokenRequest } from "../request/CommonRefreshTokenRequest.js";
import { Authority } from "../authority/Authority.js";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse.js";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder.js";
import {
    GrantType,
    AuthenticationScheme,
    Errors,
    HeaderNames,
} from "../utils/Constants.js";
import * as AADServerParamKeys from "../constants/AADServerParamKeys.js";
import { ResponseHandler } from "../response/ResponseHandler.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator.js";
import { StringUtils } from "../utils/StringUtils.js";
import { RequestThumbprint } from "../network/RequestThumbprint.js";
import { NetworkResponse } from "../network/NetworkManager.js";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest.js";
import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../error/ClientAuthError.js";
import { ServerError } from "../error/ServerError.js";
import * as TimeUtils from "../utils/TimeUtils.js";
import { UrlString } from "../url/UrlString.js";
import { CcsCredentialType } from "../account/CcsCredential.js";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo.js";
import {
    InteractionRequiredAuthError,
    InteractionRequiredAuthErrorCodes,
    createInteractionRequiredAuthError,
} from "../error/InteractionRequiredAuthError.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient.js";
import { invoke, invokeAsync } from "../utils/FunctionWrappers.js";
import { generateCredentialKey } from "../cache/utils/CacheHelpers.js";
import { ClientAssertion } from "../account/ClientCredentials.js";
import { getClientAssertion } from "../utils/ClientAssertionUtils.js";

const DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS = 300; // 5 Minutes

/**
 * OAuth2.0 refresh token client
 * @internal
 */
export class RefreshTokenClient extends BaseClient {
    constructor(
        configuration: ClientConfiguration,
        performanceClient?: IPerformanceClient
    ) {
        super(configuration, performanceClient);
    }
    public async acquireToken(
        request: CommonRefreshTokenRequest
    ): Promise<AuthenticationResult> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireToken,
            request.correlationId
        );

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await invokeAsync(
            this.executeTokenRequest.bind(this),
            PerformanceEvents.RefreshTokenClientExecuteTokenRequest,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request, this.authority);

        // Retrieve requestId from response headers
        const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];
        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );
        responseHandler.validateTokenResponse(response.body);

        return invokeAsync(
            responseHandler.handleServerTokenResponse.bind(responseHandler),
            PerformanceEvents.HandleServerTokenResponse,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(
            response.body,
            this.authority,
            reqTimestamp,
            request,
            undefined,
            undefined,
            true,
            request.forceCache,
            requestId
        );
    }

    /**
     * Gets cached refresh token and attaches to request, then calls acquireToken API
     * @param request
     */
    public async acquireTokenByRefreshToken(
        request: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.tokenRequestEmpty
            );
        }

        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireTokenByRefreshToken,
            request.correlationId
        );

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw createClientAuthError(
                ClientAuthErrorCodes.noAccountInSilentRequest
            );
        }

        // try checking if FOCI is enabled for the given application
        const isFOCI = this.cacheManager.isAppMetadataFOCI(
            request.account.environment
        );

        // if the app is part of the family, retrive a Family refresh token if present and make a refreshTokenRequest
        if (isFOCI) {
            try {
                return await invokeAsync(
                    this.acquireTokenWithCachedRefreshToken.bind(this),
                    PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                    this.logger,
                    this.performanceClient,
                    request.correlationId
                )(request, true);
            } catch (e) {
                const noFamilyRTInCache =
                    e instanceof InteractionRequiredAuthError &&
                    e.errorCode ===
                        InteractionRequiredAuthErrorCodes.noTokensFound;
                const clientMismatchErrorWithFamilyRT =
                    e instanceof ServerError &&
                    e.errorCode === Errors.INVALID_GRANT_ERROR &&
                    e.subError === Errors.CLIENT_MISMATCH_ERROR;

                // if family Refresh Token (FRT) cache acquisition fails or if client_mismatch error is seen with FRT, reattempt with application Refresh Token (ART)
                if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
                    return invokeAsync(
                        this.acquireTokenWithCachedRefreshToken.bind(this),
                        PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                        this.logger,
                        this.performanceClient,
                        request.correlationId
                    )(request, false);
                    // throw in all other cases
                } else {
                    throw e;
                }
            }
        }
        // fall back to application refresh token acquisition
        return invokeAsync(
            this.acquireTokenWithCachedRefreshToken.bind(this),
            PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request, false);
    }

    /**
     * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
     * @param request
     */
    private async acquireTokenWithCachedRefreshToken(
        request: CommonSilentFlowRequest,
        foci: boolean
    ) {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
            request.correlationId
        );

        // fetches family RT or application RT based on FOCI value
        const refreshToken = invoke(
            this.cacheManager.getRefreshToken.bind(this.cacheManager),
            PerformanceEvents.CacheManagerGetRefreshToken,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(
            request.account,
            foci,
            undefined,
            this.performanceClient,
            request.correlationId
        );

        if (!refreshToken) {
            throw createInteractionRequiredAuthError(
                InteractionRequiredAuthErrorCodes.noTokensFound
            );
        }

        if (
            refreshToken.expiresOn &&
            TimeUtils.isTokenExpired(
                refreshToken.expiresOn,
                request.refreshTokenExpirationOffsetSeconds ||
                    DEFAULT_REFRESH_TOKEN_EXPIRATION_OFFSET_SECONDS
            )
        ) {
            throw createInteractionRequiredAuthError(
                InteractionRequiredAuthErrorCodes.refreshTokenExpired
            );
        }
        // attach cached RT size to the current measurement

        const refreshTokenRequest: CommonRefreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret,
            authenticationScheme:
                request.authenticationScheme || AuthenticationScheme.BEARER,
            ccsCredential: {
                credential: request.account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID,
            },
        };

        try {
            return await invokeAsync(
                this.acquireToken.bind(this),
                PerformanceEvents.RefreshTokenClientAcquireToken,
                this.logger,
                this.performanceClient,
                request.correlationId
            )(refreshTokenRequest);
        } catch (e) {
            if (
                e instanceof InteractionRequiredAuthError &&
                e.subError === InteractionRequiredAuthErrorCodes.badToken
            ) {
                // Remove bad refresh token from cache
                this.logger.verbose(
                    "acquireTokenWithRefreshToken: bad refresh token, removing from cache"
                );
                const badRefreshTokenKey = generateCredentialKey(refreshToken);
                this.cacheManager.removeRefreshToken(badRefreshTokenKey);
            }

            throw e;
        }
    }

    /**
     * Constructs the network message and makes a NW call to the underlying secure token service
     * @param request
     * @param authority
     */
    private async executeTokenRequest(
        request: CommonRefreshTokenRequest,
        authority: Authority
    ): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RefreshTokenClientExecuteTokenRequest,
            request.correlationId
        );

        const queryParametersString = this.createTokenQueryParameters(request);
        const endpoint = UrlString.appendQueryString(
            authority.tokenEndpoint,
            queryParametersString
        );

        const requestBody = await invokeAsync(
            this.createTokenRequestBody.bind(this),
            PerformanceEvents.RefreshTokenClientCreateTokenRequestBody,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(request);
        const headers: Record<string, string> = this.createTokenRequestHeaders(
            request.ccsCredential
        );
        const thumbprint: RequestThumbprint = {
            clientId:
                request.tokenBodyParameters?.clientId ||
                this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
        };

        return invokeAsync(
            this.executePostToTokenEndpoint.bind(this),
            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
            this.logger,
            this.performanceClient,
            request.correlationId
        )(
            endpoint,
            requestBody,
            headers,
            thumbprint,
            request.correlationId,
            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint
        );
    }

    /**
     * Helper function to create the token request body
     * @param request
     */
    private async createTokenRequestBody(
        request: CommonRefreshTokenRequest
    ): Promise<string> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RefreshTokenClientCreateTokenRequestBody,
            request.correlationId
        );

        const correlationId = request.correlationId;
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(
            request.tokenBodyParameters?.[AADServerParamKeys.CLIENT_ID] ||
                this.config.authOptions.clientId
        );

        if (request.redirectUri) {
            parameterBuilder.addRedirectUri(request.redirectUri);
        }

        parameterBuilder.addScopes(
            request.scopes,
            true,
            this.config.authOptions.authority.options.OIDCOptions?.defaultScopes
        );

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(
            this.config.telemetry.application
        );
        parameterBuilder.addThrottling();

        if (this.serverTelemetryManager && !isOidcProtocolMode(this.config)) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addRefreshToken(request.refreshToken);

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(
                this.config.clientCredentials.clientSecret
            );
        }

        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion: ClientAssertion =
                this.config.clientCredentials.clientAssertion;

            parameterBuilder.addClientAssertion(
                await getClientAssertion(
                    clientAssertion.assertion,
                    this.config.authOptions.clientId,
                    request.resourceRequestUri
                )
            );
            parameterBuilder.addClientAssertionType(
                clientAssertion.assertionType
            );
        }

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(
                this.cryptoUtils,
                this.performanceClient
            );

            let reqCnfData;
            if (!request.popKid) {
                const generatedReqCnfData = await invokeAsync(
                    popTokenGenerator.generateCnf.bind(popTokenGenerator),
                    PerformanceEvents.PopTokenGenerateCnf,
                    this.logger,
                    this.performanceClient,
                    request.correlationId
                )(request, this.logger);

                reqCnfData = generatedReqCnfData.reqCnfString;
            } else {
                reqCnfData = this.cryptoUtils.encodeKid(request.popKid);
            }

            // SPA PoP requires full Base64Url encoded req_cnf string (unhashed)
            parameterBuilder.addPopToken(reqCnfData);
        } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
            if (request.sshJwk) {
                parameterBuilder.addSshJwk(request.sshJwk);
            } else {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk
                );
            }
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            parameterBuilder.addClaims(
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }

        if (
            this.config.systemOptions.preventCorsPreflight &&
            request.ccsCredential
        ) {
            switch (request.ccsCredential.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(
                            request.ccsCredential.credential
                        );
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose(
                            "Could not parse home account ID for CCS Header: " +
                                e
                        );
                    }
                    break;
                case CcsCredentialType.UPN:
                    parameterBuilder.addCcsUpn(
                        request.ccsCredential.credential
                    );
                    break;
            }
        }

        if (request.tokenBodyParameters) {
            parameterBuilder.addExtraQueryParameters(
                request.tokenBodyParameters
            );
        }

        return parameterBuilder.createQueryString();
    }
}
