/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { RefreshTokenClient } from "../RefreshTokenClient";
import { RefreshTokenRequest } from "../../request/RefreshTokenRequest";
import { ResponseHandler } from "../../response/ResponseHandler";
import { RequestParameterBuilder } from "../../request/RequestParameterBuilder";
import { StringUtils } from "../../utils/StringUtils";
import { BrokerAuthenticationResult } from "../../response/BrokerAuthenticationResult";

/**
 * Oauth2.0 Refresh Token client implementing the broker protocol for browsers.
 */
export class BrokerRefreshTokenClient extends RefreshTokenClient {
    async acquireToken(request: RefreshTokenRequest): Promise<BrokerAuthenticationResult>{
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
        const tokenResponse = responseHandler.handleBrokeredServerTokenResponse(
            response.body,
            this.authority,
            undefined,
            request.scopes
        );

        return tokenResponse;
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    protected async createTokenRequestBody(request: RefreshTokenRequest): Promise<string> {
        const parameterBuilder = new RequestParameterBuilder();

        // TODO: Add broker params

        const tokenRequestString = parameterBuilder.createQueryString();
        return StringUtils.isEmpty(tokenRequestString) ? 
            // No broker params
            super.createTokenRequestBody(request) : 
            // Append broker params to other request params
            `${super.createTokenRequestBody(request)}&${tokenRequestString}`;
    }
}
