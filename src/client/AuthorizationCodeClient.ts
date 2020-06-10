/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { GrantType } from "../utils/Constants";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { NetworkResponse } from "../network/NetworkManager";
import { ScopeSet } from "../request/ScopeSet";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";

/**
 * Oauth2.0 Authorization Code client
 */
export class AuthorizationCodeClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Creates the URL of the authorization request letting the user input credentials and consent to the
     * application. The URL target the /authorize endpoint of the authority configured in the
     * application object.
     *
     * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
     * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
     * acquireToken(AuthorizationCodeRequest)
     * @param request
     */
    async getAuthCodeUrl(request: AuthorizationUrlRequest): Promise<string> {

        const queryString = this.createAuthCodeUrlQueryString(request);
        return `${this.defaultAuthority.authorizationEndpoint}?${queryString}`;
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireToken(request: AuthorizationCodeRequest): Promise<AuthenticationResult> {

        this.logger.info("in acquireToken call");

        const response = await this.executeTokenRequest(this.defaultAuthority, request);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.unifiedCacheManager,
            this.cryptoUtils,
            this.logger
        );

        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = responseHandler.generateAuthenticationResult(
            response.body,
            this.defaultAuthority
        );

        return tokenResponse;
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: AuthorizationCodeRequest)
        : Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {

        const requestBody = this.createTokenRequestBody(request);
        const headers: Map<string, string> = this.createDefaultTokenRequestHeaders();

        return this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers);
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private createTokenRequestBody(request: AuthorizationCodeRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri);

        const scopeSet = new ScopeSet(request.scopes || [], this.config.authOptions.clientId);
        parameterBuilder.addScopes(scopeSet);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            parameterBuilder.addCodeVerifier(request.codeVerifier);
        }

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
        parameterBuilder.addClientInfo();

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private createAuthCodeUrlQueryString(request: AuthorizationUrlRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const scopeSet = new ScopeSet(request.scopes || [], this.config.authOptions.clientId);
        if (request.extraScopesToConsent) {
            scopeSet.appendScopes(request.extraScopesToConsent);
        }
        parameterBuilder.addScopes(scopeSet);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri);

        // generate the correlationId if not set by the user and add
        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        // add response_mode. If not passed in it defaults to query.
        parameterBuilder.addResponseMode(request.responseMode);

        // add response_type = code
        parameterBuilder.addResponseTypeCode();

        // add library info parameters
        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        if (request.codeChallenge) {
            parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
        }

        if (request.state) {
            parameterBuilder.addState(request.state);
        }

        if (request.prompt) {
            parameterBuilder.addPrompt(request.prompt);
        }

        if (request.loginHint) {
            parameterBuilder.addLoginHint(request.loginHint);
        }

        if (request.domainHint) {
            parameterBuilder.addDomainHint(request.domainHint);
        }

        if (request.nonce) {
            parameterBuilder.addNonce(request.nonce);
        }

        if (request.claims) {
            parameterBuilder.addClaims(request.claims);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }
}
