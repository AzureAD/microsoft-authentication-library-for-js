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
import * as RequestParameterBuilder from "../request/RequestParameterBuilder.js";
import * as UrlUtils from "../utils/UrlUtils.js";
import * as Constants from "../utils/Constants.js";
import * as AADServerParamKeys from "../constants/AADServerParamKeys.js";
import { ResponseHandler } from "../response/ResponseHandler.js";
import { AuthenticationResult } from "../response/AuthenticationResult.js";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator.js";
import { StringUtils } from "../utils/StringUtils.js";
import { NetworkResponse } from "../network/NetworkResponse.js";
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
import * as PerformanceEvents from "../telemetry/performance/PerformanceEvents.js";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient.js";
import { invoke, invokeAsync } from "../utils/FunctionWrappers.js";
import { ClientAssertion } from "../account/ClientCredentials.js";
import { getClientAssertion } from "../utils/ClientAssertionUtils.js";
import { getRequestThumbprint } from "../network/RequestThumbprint.js";

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
        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await invokeAsync(
            this.executeTokenRequest.bind(this),
            PerformanceEvents.RefreshTokenClientExecuteTokenRequest,
            this.l,
            this.pc,
            request.correlationId
        )(request, this.auth);

        // Retrieve requestId from response headers
        const requestId =
            response.headers?.[Constants.HeaderNames.X_MS_REQUEST_ID];
        const responseHandler = new ResponseHandler(
            this.cfg.authOptions.clientId,
            this.cm,
            this.cry,
            this.l,
            this.cfg.serializableCache,
            this.cfg.persistencePlugin
        );
        responseHandler.validateTokenResponse(response.body);

        return invokeAsync(
            responseHandler.handleServerTokenResponse.bind(responseHandler),
            PerformanceEvents.HandleServerTokenResponse,
            this.l,
            this.pc,
            request.correlationId
        )(
            response.body,
            this.auth,
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
        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw createClientAuthError(
                ClientAuthErrorCodes.noAccountInSilentRequest
            );
        }

        // try checking if FOCI is enabled for the given application
        const isFOCI = this.cm.isAppMetadataFOCI(
            request.account.environment
        );

        // if the app is part of the family, retrive a Family refresh token if present and make a refreshTokenRequest
        if (isFOCI) {
            try {
                return await invokeAsync(
                    this.acquireTokenWithCachedRefreshToken.bind(this),
                    PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                    this.l,
                    this.pc,
                    request.correlationId
                )(request, true);
            } catch (e) {
                const noFamilyRTInCache =
                    e instanceof InteractionRequiredAuthError &&
                    e.errorCode ===
                        InteractionRequiredAuthErrorCodes.noTokensFound;
                const clientMismatchErrorWithFamilyRT =
                    e instanceof ServerError &&
                    e.errorCode === Constants.INVALID_GRANT_ERROR &&
                    e.subError === Constants.CLIENT_MISMATCH_ERROR;

                // if family Refresh Token (FRT) cache acquisition fails or if client_mismatch error is seen with FRT, reattempt with application Refresh Token (ART)
                if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
                    return invokeAsync(
                        this.acquireTokenWithCachedRefreshToken.bind(this),
                        PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken,
                        this.l,
                        this.pc,
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
            this.l,
            this.pc,
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
        // fetches family RT or application RT based on FOCI value
        const refreshToken = invoke(
            this.cm.getRefreshToken.bind(this.cm),
            PerformanceEvents.CacheManagerGetRefreshToken,
            this.l,
            this.pc,
            request.correlationId
        )(request.account, foci, request.correlationId, undefined);

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
            this.pc?.addFields(
                { rtExpiresOnMs: Number(refreshToken.expiresOn) },
                request.correlationId
            );
            throw createInteractionRequiredAuthError(
                InteractionRequiredAuthErrorCodes.refreshTokenExpired
            );
        }
        // attach cached RT size to the current measurement

        const refreshTokenRequest: CommonRefreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret,
            authenticationScheme:
                request.authenticationScheme ||
                Constants.AuthenticationScheme.BEARER,
            ccsCredential: {
                credential: request.account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID,
            },
        };

        try {
            return await invokeAsync(
                this.acquireToken.bind(this),
                PerformanceEvents.RefreshTokenClientAcquireToken,
                this.l,
                this.pc,
                request.correlationId
            )(refreshTokenRequest);
        } catch (e) {
            if (e instanceof InteractionRequiredAuthError) {
                this.pc?.addFields(
                    { rtExpiresOnMs: Number(refreshToken.expiresOn) },
                    request.correlationId
                );

                if (e.subError === InteractionRequiredAuthErrorCodes.badToken) {
                    // Remove bad refresh token from cache
                    this.l.verbose(
                        "acquireTokenWithRefreshToken: bad refresh token, removing from cache"
                    );
                    const badRefreshTokenKey =
                        this.cm.generateCredentialKey(refreshToken);
                    this.cm.removeRefreshToken(
                        badRefreshTokenKey,
                        request.correlationId
                    );
                }
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
        const queryParametersString = this.createTokenQueryParameters(request);
        const endpoint = UrlString.appendQueryString(
            authority.tokenEndpoint,
            queryParametersString
        );

        const requestBody = await invokeAsync(
            this.createTokenRequestBody.bind(this),
            PerformanceEvents.RefreshTokenClientCreateTokenRequestBody,
            this.l,
            this.pc,
            request.correlationId
        )(request);
        const headers: Record<string, string> = this.createTokenRequestHeaders(
            request.ccsCredential
        );

        const thumbprint = getRequestThumbprint(
            this.cfg.authOptions.clientId,
            request
        );

        return invokeAsync(
            this.executePostToTokenEndpoint.bind(this),
            PerformanceEvents.RefreshTokenClientExecutePostToTokenEndpoint,
            this.l,
            this.pc,
            request.correlationId
        )(endpoint, requestBody, headers, thumbprint, request.correlationId);
    }

    /**
     * Helper function to create the token request body
     * @param request
     */
    private async createTokenRequestBody(
        request: CommonRefreshTokenRequest
    ): Promise<string> {
        const parameters = new Map<string, string>();

        RequestParameterBuilder.addClientId(
            parameters,
            request.embeddedClientId ||
                request.tokenBodyParameters?.[AADServerParamKeys.CLIENT_ID] ||
                this.cfg.authOptions.clientId
        );

        if (request.redirectUri) {
            RequestParameterBuilder.addRedirectUri(
                parameters,
                request.redirectUri
            );
        }

        RequestParameterBuilder.addScopes(
            parameters,
            request.scopes,
            true,
            this.cfg.authOptions.authority.options.OIDCOptions?.defaultScopes
        );

        RequestParameterBuilder.addGrantType(
            parameters,
            Constants.GrantType.REFRESH_TOKEN_GRANT
        );

        RequestParameterBuilder.addClientInfo(parameters);

        RequestParameterBuilder.addLibraryInfo(
            parameters,
            this.cfg.libraryInfo
        );
        RequestParameterBuilder.addApplicationTelemetry(
            parameters,
            this.cfg.telemetry.application
        );
        RequestParameterBuilder.addThrottling(parameters);

        if (this.stm && !isOidcProtocolMode(this.cfg)) {
            RequestParameterBuilder.addServerTelemetry(
                parameters,
                this.stm
            );
        }

        RequestParameterBuilder.addRefreshToken(
            parameters,
            request.refreshToken
        );

        if (this.cfg.clientCredentials.clientSecret) {
            RequestParameterBuilder.addClientSecret(
                parameters,
                this.cfg.clientCredentials.clientSecret
            );
        }

        if (this.cfg.clientCredentials.clientAssertion) {
            const clientAssertion: ClientAssertion =
                this.cfg.clientCredentials.clientAssertion;

            RequestParameterBuilder.addClientAssertion(
                parameters,
                await getClientAssertion(
                    clientAssertion.assertion,
                    this.cfg.authOptions.clientId,
                    request.resourceRequestUri
                )
            );
            RequestParameterBuilder.addClientAssertionType(
                parameters,
                clientAssertion.assertionType
            );
        }

        if (
            request.authenticationScheme === Constants.AuthenticationScheme.POP
        ) {
            const popTokenGenerator = new PopTokenGenerator(
                this.cry,
                this.pc
            );

            let reqCnfData;
            if (!request.popKid) {
                const generatedReqCnfData = await invokeAsync(
                    popTokenGenerator.generateCnf.bind(popTokenGenerator),
                    PerformanceEvents.PopTokenGenerateCnf,
                    this.l,
                    this.pc,
                    request.correlationId
                )(request, this.l);

                reqCnfData = generatedReqCnfData.reqCnfString;
            } else {
                reqCnfData = this.cry.encodeKid(request.popKid);
            }

            // SPA PoP requires full Base64Url encoded req_cnf string (unhashed)
            RequestParameterBuilder.addPopToken(parameters, reqCnfData);
        } else if (
            request.authenticationScheme === Constants.AuthenticationScheme.SSH
        ) {
            if (request.sshJwk) {
                RequestParameterBuilder.addSshJwk(parameters, request.sshJwk);
            } else {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.missingSshJwk
                );
            }
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.cfg.authOptions.clientCapabilities &&
                this.cfg.authOptions.clientCapabilities.length > 0)
        ) {
            RequestParameterBuilder.addClaims(
                parameters,
                request.claims,
                this.cfg.authOptions.clientCapabilities
            );
        }

        if (
            this.cfg.systemOptions.preventCorsPreflight &&
            request.ccsCredential
        ) {
            switch (request.ccsCredential.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(
                            request.ccsCredential.credential
                        );
                        RequestParameterBuilder.addCcsOid(
                            parameters,
                            clientInfo
                        );
                    } catch (e) {
                        this.l.verbose(
                            "Could not parse home account ID for CCS Header: " +
                                e
                        );
                    }
                    break;
                case CcsCredentialType.UPN:
                    RequestParameterBuilder.addCcsUpn(
                        parameters,
                        request.ccsCredential.credential
                    );
                    break;
            }
        }

        if (request.embeddedClientId) {
            RequestParameterBuilder.addBrokerParameters(
                parameters,
                this.cfg.authOptions.clientId,
                this.cfg.authOptions.redirectUri
            );
        }

        if (request.tokenBodyParameters) {
            RequestParameterBuilder.addExtraQueryParameters(
                parameters,
                request.tokenBodyParameters
            );
        }

        RequestParameterBuilder.instrumentBrokerParams(
            parameters,
            request.correlationId,
            this.pc
        );
        return UrlUtils.mapToQueryString(parameters);
    }
}
