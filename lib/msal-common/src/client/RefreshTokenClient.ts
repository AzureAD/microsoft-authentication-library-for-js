/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { Authority } from "../authority/Authority";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType, Errors } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { NetworkResponse } from "../network/NetworkManager";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "../error/ClientAuthError";
import { ServerError } from "../error/ServerError";

/**
 * OAuth2.0 refresh token client
 */
export class RefreshTokenClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    public async acquireToken(request: RefreshTokenRequest): Promise<AuthenticationResult>{
        const response = await this.executeTokenRequest(request, this.authority);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger
        );

        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = responseHandler.handleServerTokenResponse(
            response.body,
            this.authority
        );

        return tokenResponse;
    }

    /**
     * Gets cached refresh token and attaches to request, then calls acquireToken API
     * @param request
     */

    public async acquireTokenByRefreshToken(request: SilentFlowRequest): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        // We currently do not support silent flow for account === null use cases; This will be revisited for confidential flow usecases
        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }

        // try checking if Family Refresh Token (FRT) is available
        const familyRTResult = await this.acquireFamilyRefreshToken(request);
        if (familyRTResult) {
            return familyRTResult;
        }
        // fetch application Refresh Token (ART)
        else {
            const refreshToken = this.cacheManager.readRefreshTokenFromCache(this.config.authOptions.clientId, request.account, false);
            // no refresh Token
            if (!refreshToken) {
                throw ClientAuthError.createNoTokensFoundError();
            }

            const refreshTokenRequest: RefreshTokenRequest = {
                ...request,
                refreshToken: refreshToken.secret
            };

            const refreshTokenResult = await this.acquireToken(refreshTokenRequest);
            return refreshTokenResult;
        }

    }

    /**
     * retrive a Family refresh token if present and make a refreshTokenRequest
     * @param request
     */
    private async acquireFamilyRefreshToken(request: SilentFlowRequest): Promise<AuthenticationResult> {
        const isFOCI = this.cacheManager.isAppMetadataFOCI(request.account.environment, this.config.authOptions.clientId);

        // if the app is part of the family
        if (isFOCI) {
            const familyRefreshToken = this.cacheManager.readRefreshTokenFromCache(this.config.authOptions.clientId, request.account, true);
            // no family refresh Token
            if (!familyRefreshToken) {
                return null;
            } else {
                const refreshTokenRequest: RefreshTokenRequest = {
                    ...request,
                    refreshToken: familyRefreshToken.secret
                };

                try {
                    return this.acquireToken(refreshTokenRequest);
                } catch (e) {
                    // if client_mismatch, retry with ART and hence we return null
                    if (e instanceof ServerError && e.errorCode === Errors.INVALID_GRANT_ERROR && e.subError === Errors.CLIENT_MISMATCH_ERROR) {
                        return null;
                    } else {
                        throw e;
                    }
                }
            }
        }
        return null;
    }

    private async executeTokenRequest(request: RefreshTokenRequest, authority: Authority)
        : Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const requestBody = this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes
        };

        return this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers, thumbprint);
    }

    private createTokenRequestBody(request: RefreshTokenRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

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

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        return parameterBuilder.createQueryString();
    }
}
