/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { AuthorizationCodeUrlRequest } from "../request/AuthorizationCodeUrlRequest";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestUtils } from "../utils/RequestUtils";
import { RequestValidator } from "../request/RequestValidator";
import { GrantType } from "../utils/Constants";
import { Configuration } from "../config/Configuration";

/**
 * Oauth2.0 Authorization Code client
 */
export class AuthorizationCodeClient extends BaseClient {

    constructor(configuration: Configuration) {

        super({
            authOptions: configuration.authOptions,
            systemOptions: configuration.systemOptions,
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
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
        const queryParams: Map<string, string> = this.generateAuthCodeUrlParams(request);
        const queryString = RequestUtils.createQueryString(queryParams);
        return authority.authorizationEndpoint + "?" + queryString;
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the authorization_code_grant
     * @param request
     */
    async acquireToken(request: AuthorizationCodeRequest): Promise<string> {

        const authority: Authority = await this.createAuthority(request && request.authority);
        const acquiredTokenResponse = this.executeTokenRequest(authority, request);
        return acquiredTokenResponse;

        // add response_handler here to send the response
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: AuthorizationCodeRequest): Promise<string> {

        const tokenParameters: Map<string, string> = this.generateAuthCodeParams(request);

        let acquiredTokenResponse;
        try {
            acquiredTokenResponse = this.networkClient.sendPostRequestAsync<string>(
                authority.tokenEndpoint,
                {
                    body: RequestUtils.createQueryString(tokenParameters),
                    headers: this.createDefaultTokenRequestHeaders()
                }
            );
            return acquiredTokenResponse;
        } catch (error) {
            console.log(error.response.data); // TODO use logger
            return error.response.data;
        }
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private generateAuthCodeParams(request: AuthorizationCodeRequest) : Map<string, string> {
        const paramsMap: Map<string, string> = new Map<string, string>();

        RequestUtils.addClientId(paramsMap, this.config.authOptions.clientId);

        // validate and add scopes
        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );
        RequestUtils.addScopes(paramsMap, scopes);

        // validate the redirectUri (to be a non null value)
        RequestValidator.validateRedirectUri(request.redirectUri);
        RequestUtils.addRedirectUri(paramsMap, request.redirectUri);

        // add code: user set, not validated
        RequestUtils.addAuthorizationCode(paramsMap, request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            RequestUtils.addCodeVerifier(paramsMap, request.codeVerifier);
        }

        RequestUtils.addGrantType(paramsMap, GrantType.AUTHORIZATION_CODE_GRANT);

        return paramsMap;
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private generateAuthCodeUrlParams(request: AuthorizationCodeUrlRequest): Map<string, string>{
        const paramsMap = new Map<string, string>();

        RequestUtils.addClientId(paramsMap, this.config.authOptions.clientId);

        // validate and add scopes
        const scopes = RequestValidator.validateAndGenerateScopes(
            request.scopes,
            this.config.authOptions.clientId
        );
        RequestUtils.addScopes(paramsMap, scopes);

        // validate the redirectUri (to be a non null value)
        RequestValidator.validateRedirectUri(request.redirectUri);
        RequestUtils.addRedirectUri(paramsMap, request.redirectUri);

        // generate the correlationId if not set by the user and add
        const correlationId = request.correlationId
            ? request.correlationId
            : this.config.cryptoInterface.createNewGuid();
        RequestUtils.addCorrelationId(paramsMap, correlationId);

        // add response_mode = fragment (currently hardcoded, have a future option to pass 'query' if the user chooses to)
        RequestUtils.addResponseMode(paramsMap, request.responseMode);

        // add response_type = code
        RequestUtils.addResponseTypeCode(paramsMap);

        if (request.codeChallenge) {
            RequestValidator.validateCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
            RequestUtils.addCodeChallengeParams(paramsMap, request.codeChallenge, request.codeChallengeMethod);
        }

        if (request.state) {
            RequestUtils.addState(paramsMap, request.state);
        }

        if (request.prompt) {
            RequestValidator.validatePrompt(request.prompt);
            RequestUtils.addPrompt(paramsMap, request.prompt);
        }

        if (request.loginHint) {
            RequestUtils.addLoginHint(paramsMap, request.loginHint);
        }

        if (request.domainHint) {
            RequestUtils.addDomainHint(paramsMap, request.domainHint);
        }

        if (request.nonce) {
            RequestUtils.addNonce(paramsMap, request.nonce);
        }

        return paramsMap;
    }
}
