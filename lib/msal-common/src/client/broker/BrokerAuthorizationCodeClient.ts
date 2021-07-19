/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizationCodeClient } from "../AuthorizationCodeClient";
import { RequestParameterBuilder } from "../../request/RequestParameterBuilder";
import { StringUtils } from "../../utils/StringUtils";
import { ClientAuthError } from "../../error/ClientAuthError";
import { ResponseHandler } from "../../response/ResponseHandler";
import { BrokerAuthenticationResult } from "../../response/BrokerAuthenticationResult";
import { BrokeredAuthorizationCodeRequest } from "../../request/broker/BrokeredAuthorizationCodeRequest";
import { BrokeredAuthorizationUrlRequest } from "../../request/broker/BrokeredAuthorizationUrlRequest";
import { AuthenticationResult } from "../../response/AuthenticationResult";
import { AuthenticationScheme, GrantType } from "../../utils/Constants";
import { PopTokenGenerator } from "../../crypto/PopTokenGenerator";
import { AuthorizationCodePayload } from "../../response/AuthorizationCodePayload";
import { TimeUtils } from "../../utils/TimeUtils";

/**
 * Oauth2.0 Authorization Code client implementing the broker protocol for browsers.
 */
export class BrokerAuthorizationCodeClient extends AuthorizationCodeClient {

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireToken(request: BrokeredAuthorizationCodeRequest, authCodePayload?: AuthorizationCodePayload): Promise<AuthenticationResult | BrokerAuthenticationResult> {
        this.logger.info("in acquireToken call");
        // If no code response is given, we cannot acquire a token.
        if (!request || StringUtils.isEmpty(request.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

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
        if (!request.embeddedAppClientId) {
            return await responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, authCodePayload);
        } else {
            return await responseHandler.handleBrokeredServerTokenResponse(response.body, this.authority, reqTimestamp, request, request.redirectUri, authCodePayload);
        }
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    protected createAuthCodeUrlQueryString(request: BrokeredAuthorizationUrlRequest): string {
        if (!request.embeddedAppClientId) {
            return super.createAuthCodeUrlQueryString(request);
        }
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(request.embeddedAppClientId);

        const requestScopes = [...request.scopes || [], ...request.extraScopesToConsent || []];
        parameterBuilder.addScopes(requestScopes);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri, this.config.authOptions.clientId);

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

        if (request.codeChallenge && request.codeChallengeMethod) {
            parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
        }

        if (request.prompt) {
            parameterBuilder.addPrompt(request.prompt);
        }

        if (request.domainHint) {
            parameterBuilder.addDomainHint(request.domainHint);
        }

        // Add sid or loginHint with preference for sid -> loginHint -> username of AccountInfo object
        if (request.sid) {
            parameterBuilder.addSid(request.sid);
        } else if (request.loginHint) {
            parameterBuilder.addLoginHint(request.loginHint);
        } else if (request.account && request.account.username) {
            parameterBuilder.addLoginHint(request.account.username);
        }

        if (request.nonce) {
            parameterBuilder.addNonce(request.nonce);
        }

        if (request.state) {
            parameterBuilder.addState(request.state);
        }

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            if (!request.embeddedAppCnf) {
                throw ClientAuthError.createNoEmbeddedAppCnfProvidedError();
            }
            parameterBuilder.addPopToken(request.embeddedAppCnf);
        }

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        // Add broker params
        parameterBuilder.addBrokerClientId(this.config.authOptions.clientId);
        parameterBuilder.addBrokerRedirectUri(request.brokerRedirectUri);
        parameterBuilder.addTestSlice();

        return parameterBuilder.createQueryString();
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    protected async createTokenRequestBody(request: BrokeredAuthorizationCodeRequest): Promise<string> {
        if (!request.embeddedAppClientId) {
            return super.createTokenRequestBody(request);
        }
        const parameterBuilder = new RequestParameterBuilder();
        parameterBuilder.addClientId(request.embeddedAppClientId);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri, this.config.authOptions.clientId);

        // Add scope array, parameter builder will add default scopes and dedupe
        parameterBuilder.addScopes(request.scopes);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            parameterBuilder.addCodeVerifier(request.codeVerifier);
        }

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
        parameterBuilder.addClientInfo();

        if (request.authenticationScheme === AuthenticationScheme.POP && !!request.resourceRequestMethod && !!request.resourceRequestUri) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            const cnfString = await popTokenGenerator.generateCnf(request);
            parameterBuilder.addPopToken(cnfString);
        }

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        // Add broker params
        parameterBuilder.addBrokerClientId(this.config.authOptions.clientId);
        parameterBuilder.addBrokerRedirectUri(request.brokerRedirectUri);
        parameterBuilder.addTestSlice();

        return parameterBuilder.createQueryString();
    }
}
