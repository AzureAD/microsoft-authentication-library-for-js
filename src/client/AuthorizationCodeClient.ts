/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { AuthorizationCodeUrlRequest } from "../request/AuthorizationCodeUrlRequest";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { RequestValidator } from "../request/RequestValidator";
import { GrantType } from "../utils/Constants";
import { Configuration } from "../config/Configuration";
import {ServerAuthorizationTokenResponse} from "../server/ServerAuthorizationTokenResponse";
import {NetworkResponse} from "../network/NetworkManager";
import {ScopeSet} from "../request/ScopeSet";

/**
 * Oauth2.0 Authorization Code client
 */
export class AuthorizationCodeClient extends BaseClient {

    constructor(configuration: Configuration) {
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
    async getAuthCodeUrl(request: AuthorizationCodeUrlRequest): Promise<string> {

        const authority: Authority = await this.createAuthority(request && request.authority);
        const queryString = this.createAuthCodeUrlQueryString(request);
        return `${authority.authorizationEndpoint}?${queryString}`;
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the authorization_code_grant
     * @param request
     */
    async acquireToken(request: AuthorizationCodeRequest): Promise<string> {

        const authority: Authority = await this.createAuthority(request && request.authority);
        const response = await this.executeTokenRequest(authority, request);
        return JSON.stringify(response.body);
        // TODO add response_handler here to send the response
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: AuthorizationCodeRequest): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {

        const requestBody = this.createTokenRequestBody(request);
        const headers: Map<string, string> = this.createDefaultTokenRequestHeaders();

        return this.executePostToTokenEndpoint(authority.tokenEndpoint, requestBody, headers);
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private createTokenRequestBody(request: AuthorizationCodeRequest) : string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        // validate the redirectUri (to be a non null value)
        RequestValidator.validateRedirectUri(request.redirectUri);
        parameterBuilder.addRedirectUri(request.redirectUri);

        const scopeSet = new ScopeSet(
            request.scopes || [],
            this.config.authOptions.clientId,
            false);
        parameterBuilder.addScopes(scopeSet);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            parameterBuilder.addCodeVerifier(request.codeVerifier);
        }

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private createAuthCodeUrlQueryString(request: AuthorizationCodeUrlRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const scopeSet = new ScopeSet(request.scopes || [],
            this.config.authOptions.clientId,
            false);
        parameterBuilder.addScopes(scopeSet);

        // validate the redirectUri (to be a non null value)
        RequestValidator.validateRedirectUri(request.redirectUri);
        parameterBuilder.addRedirectUri(request.redirectUri);

        // generate the correlationId if not set by the user and add
        const correlationId = request.correlationId
            ? request.correlationId
            : this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        // add response_mode. If not passed in it defaults to query.
        parameterBuilder.addResponseMode(request.responseMode);

        // add response_type = code
        parameterBuilder.addResponseTypeCode();

        if (request.codeChallenge) {
            RequestValidator.validateCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
            parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
        }

        if (request.state) {
            parameterBuilder.addState(request.state);
        }

        if (request.prompt) {
            RequestValidator.validatePrompt(request.prompt);
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

        if(request.claims) {
            parameterBuilder.addClaims(request.claims);
        }

        return parameterBuilder.createQueryString();
    }
}
