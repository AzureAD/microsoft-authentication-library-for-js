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
import { GrantType, AuthenticationScheme, Errors  } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { NetworkResponse } from "../network/NetworkManager";
import { CommonSilentFlowRequest } from "../request/CommonSilentFlowRequest";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError, ClientAuthErrorMessage } from "../error/ClientAuthError";
import { ServerError } from "../error/ServerError";
import { TimeUtils } from "../utils/TimeUtils";
import { KeyManager } from "../crypto/KeyManager";
import { UrlString } from "../url/UrlString";

/**
 * OAuth2.0 refresh token client
 */
export class RefreshTokenClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    public async acquireToken(request: CommonRefreshTokenRequest): Promise<AuthenticationResult>{
        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executeTokenRequest(request, this.authority);

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
            true
        );
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
                const noFamilyRTInCache = e instanceof ClientAuthError && e.errorCode === ClientAuthErrorMessage.noTokensFoundError.code;
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
        const refreshToken = this.cacheManager.readRefreshTokenFromCache(this.config.authOptions.clientId, request.account, foci);

        // no refresh Token
        if (!refreshToken) {
            throw ClientAuthError.createNoTokensFoundError();
        }

        const refreshTokenRequest: CommonRefreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret,
            authenticationScheme: request.authenticationScheme || AuthenticationScheme.BEARER
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

        const requestBody = await this.createTokenRequestBody(request);
        const queryParameters = this.createTokenQueryParameters(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes
        };

        const endpoint = UrlString.appendQueryString(authority.tokenEndpoint, queryParameters);
        return this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint);
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
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        parameterBuilder.addThrottling();
        
        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
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
            const keyManager = new KeyManager(this.cryptoUtils);
            const cnfString = await keyManager.generateCnf(request);
            parameterBuilder.addPopToken(cnfString);
        }

        if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        return parameterBuilder.createQueryString();
    }
}
