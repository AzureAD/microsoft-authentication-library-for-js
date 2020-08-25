/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient } from "./AuthorizationCodeClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { ScopeSet } from "../request/ScopeSet";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";
import { ResponseHandler } from "../response/ResponseHandler";
import { BrokerAuthenticationResult } from "../response/BrokerAuthenticationResult";
import { GrantType } from "../utils/Constants";

/**
 * Oauth2.0 Authorization Code client implementing the broker protocol for browsers.
 */
export class BrokerAuthorizationCodeClient extends AuthorizationCodeClient {

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireTokenByBroker(request: AuthorizationCodeRequest, cachedNonce?: string, cachedState?: string): Promise<BrokerAuthenticationResult> {
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

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const scopeSet = new ScopeSet(request.scopes || []);
        if (request.extraScopesToConsent) {
            scopeSet.appendScopes(request.extraScopesToConsent);
        }
        parameterBuilder.addScopes(scopeSet);

        // TODO: Add Broker params

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

        // add client_info=1
        parameterBuilder.addClientInfo();

        if (request.codeChallenge) {
            parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
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

        if (request.sid) {
            parameterBuilder.addSid(request.sid);
        }

        if (request.nonce) {
            parameterBuilder.addNonce(request.nonce);
        }

        if (request.state) {
            parameterBuilder.addState(request.state);
        }

        if (request.claims) {
            parameterBuilder.addClaims(request.claims);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    protected createTokenRequestBody(request: AuthorizationCodeRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri);

        const scopeSet = new ScopeSet(request.scopes || []);
        parameterBuilder.addScopes(scopeSet);

        // TODO: Add broker params

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            parameterBuilder.addCodeVerifier(request.codeVerifier);
        }

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
        }

        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion = this.config.clientCredentials.clientAssertion;
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        }

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
        parameterBuilder.addClientInfo();

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        return parameterBuilder.createQueryString();
    }
}
