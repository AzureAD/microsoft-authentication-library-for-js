/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Configuration } from "../config/Configuration";
import { BaseClient } from "./BaseClient";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { Authority, NetworkResponse } from "..";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { GrantType } from "../utils/Constants";

/**
 * OAuth2.0 refresh token client
 */
export class RefreshTokenClient extends BaseClient {

    constructor(configuration: Configuration) {
        super(configuration);
    }

    public async acquireToken(request: RefreshTokenRequest): Promise<string>{
        const authority = await this.createAuthority(request.authority);
        const response = await this.executeTokenRequest(request, authority);
        // TODO add response_handler here to send the response
        return JSON.stringify(response.body);
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
            true);
        parameterBuilder.addScopes(scopeSet);
        parameterBuilder.addClientId(this.config.authOptions.clientId);
        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);
        parameterBuilder.addRefreshToken(request.refreshToken);

        return parameterBuilder.createQueryString();
    }
}
