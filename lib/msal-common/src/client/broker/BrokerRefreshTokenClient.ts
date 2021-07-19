/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RefreshTokenClient } from "../RefreshTokenClient";
import { ResponseHandler } from "../../response/ResponseHandler";
import { RequestParameterBuilder } from "../../request/RequestParameterBuilder";
import { StringUtils } from "../../utils/StringUtils";
import { BrokerAuthenticationResult } from "../../response/BrokerAuthenticationResult";
import { ClientAuthError } from "../../error/ClientAuthError";
import { AuthenticationScheme, GrantType } from "../../utils/Constants";
import { PopTokenGenerator } from "../../crypto/PopTokenGenerator";
import { AuthenticationResult } from "../../response/AuthenticationResult";
import { BrokeredRefreshTokenRequest } from "../../request/broker/BrokeredRefreshTokenRequest";
import { BrokeredSilentFlowRequest } from "../../request/broker/BrokeredSilentFlowRequest";
import { TimeUtils } from "../../utils/TimeUtils";

/**
 * Oauth2.0 Refresh Token client implementing the broker protocol for browsers.
 */
export class BrokerRefreshTokenClient extends RefreshTokenClient {
    async acquireToken(request: BrokeredRefreshTokenRequest): Promise<AuthenticationResult | BrokerAuthenticationResult> {
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
        if (request.embeddedAppClientId) {
            return responseHandler.handleBrokeredServerTokenResponse(
                response.body,
                this.authority,
                reqTimestamp,
                request,
                request.embeddedAppRedirectUri
            );
        } else {
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
    }

    /**
     * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
     * @param request
     */
    protected async acquireTokenWithCachedRefreshToken(request: BrokeredSilentFlowRequest, foci: boolean): Promise<AuthenticationResult | BrokerAuthenticationResult> {
        // fetches family RT or application RT based on FOCI value
        const refreshToken = this.cacheManager.readRefreshTokenFromCache(this.config.authOptions.clientId, request.account, foci);

        // no refresh Token
        if (!refreshToken) {
            throw ClientAuthError.createNoTokensFoundError();
        }

        const refreshTokenRequest: BrokeredRefreshTokenRequest = {
            ...request,
            refreshToken: refreshToken.secret,
            authenticationScheme: AuthenticationScheme.BEARER
        };

        return this.acquireToken(refreshTokenRequest);
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    protected async createTokenRequestBody(request: BrokeredRefreshTokenRequest): Promise<string> {
        if (!request.embeddedAppClientId) {
            return super.createTokenRequestBody(request);
        }

        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(request.embeddedAppClientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addRefreshToken(request.refreshToken);

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            parameterBuilder.addPopToken(await popTokenGenerator.generateCnf(request));
        }
        
        if (request.authenticationScheme === AuthenticationScheme.POP) {
            if (!request.embeddedAppCnf) {
                throw ClientAuthError.createNoEmbeddedAppCnfProvidedError();
            }
            parameterBuilder.addPopToken(request.embeddedAppCnf);
        }

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        // Add broker params
        parameterBuilder.addBrokerClientId(this.config.authOptions.clientId);
        parameterBuilder.addRedirectUri(request.embeddedAppRedirectUri, this.config.authOptions.clientId);
        parameterBuilder.addTestSlice();

        return parameterBuilder.createQueryString();
    }
}
