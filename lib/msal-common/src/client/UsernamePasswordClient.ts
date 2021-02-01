/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { UsernamePasswordRequest } from "../request/UsernamePasswordRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ResponseHandler } from "../response/ResponseHandler";
import { Authority } from "../authority/Authority";
import { NetworkResponse } from "../network/NetworkManager";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { GrantType } from "../utils/Constants";
import { StringUtils } from "../utils/StringUtils";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { TimeUtils } from "../utils/TimeUtils";

/**
 * Oauth2.0 Password grant client
 * Note: We are only supporting public clients for password grant and for purely testing purposes
 */
export class UsernamePasswordClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * API to acquire a token by passing the username and password to the service in exchage of credentials
     * password_grant
     * @param request
     */
    async acquireToken(request: UsernamePasswordRequest): Promise<AuthenticationResult | null> {
        this.logger.info("in acquireToken call");

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executeTokenRequest(this.authority, request);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp);

        return tokenResponse;
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: UsernamePasswordRequest): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes
        };
        const requestBody = this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();

        return this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers, thumbprint);
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private createTokenRequestBody(request: UsernamePasswordRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);
        parameterBuilder.addUsername(request.username);
        parameterBuilder.addPassword(request.password);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addGrantType(GrantType.RESOURCE_OWNER_PASSWORD_GRANT);
        parameterBuilder.addClientInfo();

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        return parameterBuilder.createQueryString();
    }
}
