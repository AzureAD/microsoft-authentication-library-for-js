/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { Authority, NetworkResponse } from "..";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType, AuthenticationScheme } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator";

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
        return await responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            request.resourceRequestMethod,
            request.resourceRequestUri
        );
    }

    private async executeTokenRequest(request: RefreshTokenRequest, authority: Authority)
        : Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {

        const requestBody = await this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();

        return this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers);
    }

    private async createTokenRequestBody(request: RefreshTokenRequest): Promise<string> {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const scopeSet = new ScopeSet(request.scopes || []);
        parameterBuilder.addScopes(scopeSet);
        
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

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            parameterBuilder.addPopToken(await popTokenGenerator.generateCnf(request.resourceRequestMethod, request.resourceRequestUri));
        }

        return parameterBuilder.createQueryString();
    }
}
