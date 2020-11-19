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

/**
 * Oauth2.0 Refresh Token client implementing the broker protocol for browsers.
 */
export class BrokerRefreshTokenClient extends RefreshTokenClient {
    async acquireToken(request: BrokeredRefreshTokenRequest): Promise<AuthenticationResult | BrokerAuthenticationResult>{
        const response = await this.executeTokenRequest(request, this.authority);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger
        );

        responseHandler.validateTokenResponse(response.body);
        if (request.brokeredClientId) {
            return responseHandler.handleBrokeredServerTokenResponse(
                response.body,
                this.authority
            );
        } else {
            return responseHandler.handleServerTokenResponse(
                response.body,
                this.authority,
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
            refreshToken: refreshToken.secret
        };

        return this.acquireToken(refreshTokenRequest);
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    protected async createTokenRequestBody(request: BrokeredRefreshTokenRequest): Promise<string> {
        if (!request.brokeredClientId) {
            return super.createTokenRequestBody(request);
        }

        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(request.brokeredClientId);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addRefreshToken(request.refreshToken);

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            parameterBuilder.addPopToken(await popTokenGenerator.generateCnf(request.resourceRequestMethod, request.resourceRequestUri));
        }

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        // Add broker params
        parameterBuilder.addBrokerClientId(this.config.authOptions.clientId);
        parameterBuilder.addRedirectUri(request.brokerRedirectUri, this.config.authOptions.clientId);

        return parameterBuilder.createQueryString();
    }
}
