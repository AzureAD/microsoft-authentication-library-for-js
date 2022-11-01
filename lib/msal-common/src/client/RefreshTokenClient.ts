/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { CommonRefreshTokenRequest } from "../request/CommonRefreshTokenRequest";
import { Authority } from "../authority/Authority";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { GrantType, AuthenticationScheme, Errors, HeaderNames } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator";
import { StringUtils } from "../utils/StringUtils";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { NetworkResponse } from "../network/NetworkManager";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "../error/ClientAuthError";
import { ServerError } from "../error/ServerError";
import { TimeUtils } from "../utils/TimeUtils";
import { UrlString } from "../url/UrlString";
import { CcsCredentialType } from "../account/CcsCredential";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo";
import { InteractionRequiredAuthError, InteractionRequiredAuthErrorMessage } from "../error/InteractionRequiredAuthError";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
/**
 * OAuth2.0 refresh token client
 */
export class RefreshTokenClient extends BaseClient {
    constructor(configuration: ClientConfiguration, performanceClient?: IPerformanceClient) {
        super(configuration, performanceClient);

    }
    public async acquireToken(request: CommonRefreshTokenRequest): Promise<AuthenticationResult> {
        const atsMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.RefreshTokenClientAcquireToken, request.correlationId);
        this.logger.verbose("RefreshTokenClientAcquireToken called", request.correlationId);
        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executeTokenRequest(request, this.authority);
        atsMeasurement?.addStaticFields({
            refreshTokenSize: response.body.refresh_token?.length || 0
        });

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

        return responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            reqTimestamp,
            request,
            undefined,
            undefined,
            true,
            request.forceCache,
            requestId
        ).then((result: AuthenticationResult) => {
            atsMeasurement?.endMeasurement({
                success: true
            });
            return result;
        })
            .catch((error) => {
                this.logger.verbose("Error in fetching refresh token", request.correlationId);
                atsMeasurement?.endMeasurement({
                    errorCode: error.errorCode,
                    subErrorCode: error.subError,
                    success: false
                });
                throw error;
            });
    }

    /**
     * Gets cached refresh token and attaches to request, then calls acquireToken API
     * @param request
     */
    public async acquireTokenByRefreshToken(request: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }

        // try checking if FOCI is enabled for the given application
        const isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment, this.config.authOptions.clientId);

        // if the app is part of the family, retrive a Family refresh token if present and make a refreshTokenRequest
        if (isFOCI) {
            try {
                return this.acquireTokenWithCachedRefreshToken(request, true);
            } catch (e) {
                const noFamilyRTInCache = e instanceof InteractionRequiredAuthError && e.errorCode === InteractionRequiredAuthErrorMessage.noTokensFoundError.code;
                const clientMismatchErrorWithFamilyRT = e instanceof ServerError && e.errorCode === Errors.INVALID_GRANT_ERROR && e.subError === Errors.CLIENT_MISMATCH_ERROR;

                // if family Refresh Token (FRT) cache acquisition fails or if client_mismatch error is seen with FRT, reattempt with application Refresh Token (ART)
                if (noFamilyRTInCache || clientMismatchErrorWithFamilyRT) {
                    return this.acquireTokenWithCachedRefreshToken(request, false);
                    // throw in all other cases
                } else {
                    throw e;
                }
            }
        }
        // fall back to application refresh token acquisition
        return this.acquireTokenWithCachedRefreshToken(request, false);

    }

    /**
     * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
     * @param request
     */
    private async acquireTokenWithCachedRefreshToken(request: CommonSilentFlowRequest, foci: boolean) {
        // fetches family RT or application RT based on FOCI value

        const atsMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.RefreshTokenClientAcquireTokenWithCachedRefreshToken, request.correlationId);
        this.logger.verbose("RefreshTokenClientAcquireTokenWithCachedRefreshToken called", request.correlationId);
        const refreshToken = this.cacheManager.readRefreshTokenFromCache(this.config.authOptions.clientId, request.account, foci);

        if (!refreshToken) {
            atsMeasurement?.discardMeasurement();
            throw InteractionRequiredAuthError.createNoTokensFoundError();
        }
        // attach cached RT size to the current measurement
        atsMeasurement?.endMeasurement({
            success: true
        });

        const refreshTokenRequest: CommonRefreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret,
            authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER,
            ccsCredential: {
                credential: request.account.homeAccountId,
                type: CcsCredentialType.HOME_ACCOUNT_ID
            }
        };

        return this.acquireToken(refreshTokenRequest);
    }

    /**
     * Constructs the network message and makes a NW call to the underlying secure token service
     * @param request
     * @param authority
     */
    private async executeTokenRequest(request: CommonRefreshTokenRequest, authority: Authority)
        : Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const acquireTokenMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.RefreshTokenClientExecuteTokenRequest, request.correlationId);
        const requestBody = await this.createTokenRequestBody(request);
        const queryParameters = this.createTokenQueryParameters(request);
        const headers: Record<string, string> = this.createTokenRequestHeaders(request.ccsCredential);
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid
        };

        const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParameters);
        return this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint)
            .then((result) => {
                acquireTokenMeasurement?.endMeasurement({
                    success: true
                });
                return result;
            })
            .catch((error) => {
                acquireTokenMeasurement?.endMeasurement({
                    success: false
                });
                throw error;
            });
    }

    /**
     * Creates query string for the /token request
     * @param request
     */
    private createTokenQueryParameters(request: CommonRefreshTokenRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.tokenQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.tokenQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Helper function to create the token request body
     * @param request
     */
    private async createTokenRequestBody(request: CommonRefreshTokenRequest): Promise<string> {
        const correlationId = request.correlationId;
        const acquireTokenMeasurement = this.performanceClient?.startMeasurement(PerformanceEvents.BaseClientCreateTokenRequestHeaders, correlationId);
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(this.config.telemetry.application);
        parameterBuilder.addThrottling();

        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addRefreshToken(request.refreshToken);

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
        }

        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion = this.config.clientCredentials.clientAssertion;
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        }

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            const reqCnfData = await popTokenGenerator.generateCnf(request);
            // SPA PoP requires full Base64Url encoded req_cnf string (unhashed)
            parameterBuilder.addPopToken(reqCnfData.reqCnfString);
        } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
            if (request.sshJwk) {
                parameterBuilder.addSshJwk(request.sshJwk);
            } else {
                acquireTokenMeasurement?.endMeasurement({
                    success: false
                });
                throw ClientConfigurationError.createMissingSshJwkError();
            }
        }

        if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        if (this.config.systemOptions.preventCorsPreflight && request.ccsCredential) {
            switch (request.ccsCredential.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.ccsCredential.credential);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                    }
                    break;
                case CcsCredentialType.UPN:
                    parameterBuilder.addCcsUpn(request.ccsCredential.credential);
                    break;
            }
        }
        acquireTokenMeasurement?.endMeasurement({
            success: true
        });
        return parameterBuilder.createQueryString();
    }
}
