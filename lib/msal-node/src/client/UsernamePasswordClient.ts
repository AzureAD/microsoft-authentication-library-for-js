/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    Authority,
    BaseClient,
    CcsCredentialType,
    ClientConfiguration,
    CommonUsernamePasswordRequest,
    GrantType,
    NetworkResponse,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    StringUtils,
    TimeUtils,
    UrlString,
} from "@azure/msal-common";

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
    async acquireToken(
        request: CommonUsernamePasswordRequest
    ): Promise<AuthenticationResult | null> {
        this.logger.info("in acquireToken call in username-password client");

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executeTokenRequest(
            this.authority,
            request
        );

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
        const tokenResponse = responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            reqTimestamp,
            request
        );

        return tokenResponse;
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(
        authority: Authority,
        request: CommonUsernamePasswordRequest
    ): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const queryParametersString = this.createTokenQueryParameters(request);
        const endpoint = UrlString.appendQueryString(
            authority.tokenEndpoint,
            queryParametersString
        );
        const requestBody = this.createTokenRequestBody(request);
        const headers: Record<string, string> = this.createTokenRequestHeaders({
            credential: request.username,
            type: CcsCredentialType.UPN,
        });
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
        };

        return this.executePostToTokenEndpoint(
            endpoint,
            requestBody,
            headers,
            thumbprint,
            request.correlationId
        );
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private createTokenRequestBody(
        request: CommonUsernamePasswordRequest
    ): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);
        parameterBuilder.addUsername(request.username);
        parameterBuilder.addPassword(request.password);

        parameterBuilder.addScopes(request.scopes);

        parameterBuilder.addResponseTypeForTokenAndIdToken();

        parameterBuilder.addGrantType(GrantType.RESOURCE_OWNER_PASSWORD_GRANT);
        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(
            this.config.telemetry.application
        );
        parameterBuilder.addThrottling();

        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        const correlationId =
            request.correlationId ||
            this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(
                this.config.clientCredentials.clientSecret
            );
        }

        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion =
                this.config.clientCredentials.clientAssertion;
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(
                clientAssertion.assertionType
            );
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            parameterBuilder.addClaims(
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }

        if (
            this.config.systemOptions.preventCorsPreflight &&
            request.username
        ) {
            parameterBuilder.addCcsUpn(request.username);
        }

        return parameterBuilder.createQueryString();
    }
}
