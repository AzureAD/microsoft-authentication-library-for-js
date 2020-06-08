/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration } from "../config/ClientConfiguration";
import { BaseClient } from "./BaseClient";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { Authority, NetworkResponse } from "..";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType } from "../utils/Constants";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";

/**
 * OAuth2.0 refresh token client
 */
export class RefreshTokenClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    public async acquireToken(request: RefreshTokenRequest): Promise<AuthenticationResult>{
        const response = await this.executeTokenRequest(request, this.defaultAuthority);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.unifiedCacheManager,
            this.cryptoUtils,
            this.logger
        );

        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = await responseHandler.generateAuthenticationResult(
            response.body,
            this.defaultAuthority
        );

        return tokenResponse;
    }

    private async executeTokenRequest(request: RefreshTokenRequest, authority: Authority)
        : Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {

        const requestBody = this.createTokenRequestBody(request);
        const headers: Map<string, string> = this.createDefaultTokenRequestHeaders();

        return this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers);
    }

    private createTokenRequestBody(request: RefreshTokenRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        const scopeSet = new ScopeSet(request.scopes || [],
            this.config.authOptions.clientId,
            false);
        parameterBuilder.addScopes(scopeSet);
        parameterBuilder.addClientId(this.config.authOptions.clientId);
        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);
        parameterBuilder.addRefreshToken(request.refreshToken);

        return parameterBuilder.createQueryString();
    }
}
