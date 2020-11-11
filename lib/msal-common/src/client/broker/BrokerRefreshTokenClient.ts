/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RefreshTokenClient } from "../RefreshTokenClient";
import { ResponseHandler } from "../../response/ResponseHandler";
import { RequestParameterBuilder } from "../../request/RequestParameterBuilder";
import { StringUtils } from "../../utils/StringUtils";
import { BrokerAuthenticationResult } from "../../response/BrokerAuthenticationResult";
import { BrokeredRefreshTokenRequest } from "../../request/BrokeredRefreshTokenRequest";
import { BrokeredSilentFlowRequest } from "../../request/BrokeredSilentFlowRequest";
import { ClientAuthError } from "../../error/ClientAuthError";

/**
 * Oauth2.0 Refresh Token client implementing the broker protocol for browsers.
 */
export class BrokerRefreshTokenClient extends RefreshTokenClient {
    async acquireToken(request: BrokeredRefreshTokenRequest): Promise<BrokerAuthenticationResult>{
        const response = await this.executeTokenRequest(request, this.authority);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger
        );

        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = responseHandler.handleBrokeredServerTokenResponse(
            response.body,
            this.authority
        );

        return tokenResponse;
    }

    /**
     * makes a network call to acquire tokens by exchanging RefreshToken available in userCache; throws if refresh token is not cached
     * @param request
     */
    protected async acquireTokenWithCachedRefreshToken(request: BrokeredSilentFlowRequest, foci: boolean) {
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
        const parameterBuilder = new RequestParameterBuilder();

        // Add broker params
        parameterBuilder.addBrokerClientId(request.brokerClientId);

        const tokenRequestString = parameterBuilder.createQueryString();
        return StringUtils.isEmpty(tokenRequestString) ? 
            // No broker params
            super.createTokenRequestBody(request) : 
            // Append broker params to other request params
            `${super.createTokenRequestBody(request)}&${tokenRequestString}`;
    }
}
