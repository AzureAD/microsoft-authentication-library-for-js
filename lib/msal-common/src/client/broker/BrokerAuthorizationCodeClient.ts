/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient } from "../AuthorizationCodeClient";
import { AuthorizationUrlRequest } from "../../request/AuthorizationUrlRequest";
import { RequestParameterBuilder } from "../../request/RequestParameterBuilder";
import { AuthorizationCodeRequest } from "../../request/AuthorizationCodeRequest";
import { StringUtils } from "../../utils/StringUtils";
import { ClientAuthError } from "../../error/ClientAuthError";
import { ResponseHandler } from "../../response/ResponseHandler";
import { BrokerAuthenticationResult } from "../../response/BrokerAuthenticationResult";

/**
 * Oauth2.0 Authorization Code client implementing the broker protocol for browsers.
 */
export class BrokerAuthorizationCodeClient extends AuthorizationCodeClient {

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireToken(request: AuthorizationCodeRequest, cachedNonce?: string, cachedState?: string): Promise<BrokerAuthenticationResult> {
        this.logger.info("in acquireToken call");
        // If no code response is given, we cannot acquire a token.
        if (!request || StringUtils.isEmpty(request.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

        const response = await this.executeTokenRequest(this.authority, request);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = responseHandler.handleBrokeredServerTokenResponse(response.body, this.authority, cachedNonce, cachedState);

        return tokenResponse;
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    protected createAuthCodeUrlQueryString(request: AuthorizationUrlRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        // TODO: Add broker params here

        const authCodeUrlQueryString = parameterBuilder.createQueryString();
        return StringUtils.isEmpty(authCodeUrlQueryString) ? 
            // No broker params
            super.createAuthCodeUrlQueryString(request) : 
            // Append broker params to other request params
            `${super.createAuthCodeUrlQueryString(request)}&${authCodeUrlQueryString}`;
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    protected createTokenRequestBody(request: AuthorizationCodeRequest): string {
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
