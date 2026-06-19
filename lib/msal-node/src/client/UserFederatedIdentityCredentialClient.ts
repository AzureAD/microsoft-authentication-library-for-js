/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    AuthenticationResult,
    Authority,
    ClientConfiguration,
    Constants,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ScopeSet,
    TimeUtils,
    UrlString,
    ClientAssertion,
    getClientAssertion,
    UrlUtils,
} from "@azure/msal-common/node";
import { ApiId } from "../utils/Constants.js";
import { BaseClient } from "./BaseClient.js";
import { CommonUserFederatedIdentityCredentialRequest } from "../request/CommonUserFederatedIdentityCredentialRequest.js";

/**
 * Client for the user_fic grant type (Leg 3 of Agent Identity).
 * Exchanges a federated identity credential (instance token) for a user-scoped token.
 * @internal
 */
export class UserFederatedIdentityCredentialClient extends BaseClient {
    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Acquires a token using the user_fic grant type.
     * Always hits the network (no cache lookup for the network call).
     * Developers use acquireTokenSilent for cached FIC tokens.
     */
    public async acquireToken(
        request: CommonUserFederatedIdentityCredentialRequest
    ): Promise<AuthenticationResult | null> {
        return this.executeTokenRequest(request, this.authority);
    }

    /**
     * Makes a network call to the token endpoint
     */
    private async executeTokenRequest(
        request: CommonUserFederatedIdentityCredentialRequest,
        authority: Authority
    ): Promise<AuthenticationResult | null> {
        // Build augmented scopes once for both thumbprint and body
        const scopeSet = new ScopeSet(
            request.scopes || [],
            request.correlationId
        );
        scopeSet.appendScopes(Constants.OIDC_DEFAULT_SCOPES);
        const augmentedScopes = scopeSet.asArray();

        const queryParametersString = this.createTokenQueryParameters(request);
        const endpoint = UrlString.appendQueryString(
            authority.tokenEndpoint,
            queryParametersString
        );
        const requestBody = await this.createTokenRequestBody(
            request,
            augmentedScopes
        );
        const headers: Record<string, string> =
            this.createTokenRequestHeaders();
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: request.authority,
            scopes: augmentedScopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
        };

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executePostToTokenEndpoint(
            endpoint,
            requestBody,
            headers,
            thumbprint,
            request.correlationId
        );

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.performanceClient,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        responseHandler.validateTokenResponse(
            response.body,
            request.correlationId
        );

        const tokenResponse = await responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            reqTimestamp,
            request,
            ApiId.acquireTokenByUserFederatedIdentityCredential
        );

        return tokenResponse;
    }

    /**
     * Builds the request body for the user_fic grant type
     */
    private async createTokenRequestBody(
        request: CommonUserFederatedIdentityCredentialRequest,
        augmentedScopes: string[]
    ): Promise<string> {
        const parameters = new Map<string, string>();

        RequestParameterBuilder.addClientId(
            parameters,
            this.config.authOptions.clientId
        );

        RequestParameterBuilder.addScopes(
            parameters,
            augmentedScopes,
            request.correlationId
        );

        RequestParameterBuilder.addGrantType(
            parameters,
            Constants.GrantType.USER_FIC
        );

        // Send client_info=1 to get homeAccountId for user cache
        RequestParameterBuilder.addClientInfo(parameters);

        // Add the user_federated_identity_credential (instance token)
        parameters.set(
            AADServerParamKeys.USER_FEDERATED_IDENTITY_CREDENTIAL,
            request.assertion
        );

        // Add user identification: either username or user_id (object ID)
        if (request.username) {
            parameters.set(AADServerParamKeys.USERNAME, request.username);
        } else if (request.userObjectId) {
            parameters.set(AADServerParamKeys.USER_ID, request.userObjectId);
        }

        RequestParameterBuilder.addLibraryInfo(
            parameters,
            this.config.libraryInfo
        );
        RequestParameterBuilder.addApplicationTelemetry(
            parameters,
            this.config.telemetry.application
        );
        RequestParameterBuilder.addThrottling(parameters);

        if (this.serverTelemetryManager) {
            RequestParameterBuilder.addServerTelemetry(
                parameters,
                this.serverTelemetryManager
            );
        }

        const correlationId =
            request.correlationId ||
            this.config.cryptoInterface.createNewGuid();
        RequestParameterBuilder.addCorrelationId(parameters, correlationId);

        // Add client credentials (secret or assertion)
        if (this.config.clientCredentials.clientSecret) {
            RequestParameterBuilder.addClientSecret(
                parameters,
                this.config.clientCredentials.clientSecret
            );
        }

        // Use per-request client assertion if provided, otherwise fall back to app-level
        const clientAssertion: ClientAssertion | undefined =
            request.clientAssertion ||
            this.config.clientCredentials.clientAssertion;

        if (clientAssertion) {
            RequestParameterBuilder.addClientAssertion(
                parameters,
                await getClientAssertion(
                    clientAssertion.assertion,
                    this.config.authOptions.clientId,
                    this.authority.tokenEndpoint
                )
            );
            RequestParameterBuilder.addClientAssertionType(
                parameters,
                clientAssertion.assertionType
            );
        }

        if (
            request.claims ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            RequestParameterBuilder.addClaims(
                parameters,
                request.correlationId,
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }

        return UrlUtils.mapToQueryString(parameters);
    }
}
