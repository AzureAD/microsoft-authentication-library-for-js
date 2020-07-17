/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { GrantType, AADServerParamKeys } from "../utils/Constants";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { NetworkResponse } from "../network/NetworkManager";
import { ScopeSet } from "../request/ScopeSet";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";
import { UrlString } from "../url/UrlString";
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager";

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
        return `${this.authority.authorizationEndpoint}?${queryString}`;
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireToken(request: AuthorizationCodeRequest, telemetryManager?: ServerTelemetryManager, cachedNonce?: string, cachedState?: string): Promise<AuthenticationResult> {
        this.logger.info("in acquireToken call");
        // If no code response is given, we cannot acquire a token.
        if (!request || StringUtils.isEmpty(request.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

        const response = await this.executeTokenRequest(this.authority, request, telemetryManager);

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(response.body);
        const tokenResponse = responseHandler.handleServerTokenResponse(response.body, this.authority, cachedNonce, cachedState);

        return tokenResponse;
    }

    /**
     * Handles the hash fragment response from public client code request. Returns a code response used by
     * the client to exchange for a token in acquireToken.
     * @param hashFragment
     */
    handleFragmentResponse(hashFragment: string, cachedState: string): string {
        // Handle responses.
        const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger);
        // Deserialize hash fragment response parameters.
        const hashUrlString = new UrlString(hashFragment);
        const serverParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();

        // Get code response
        responseHandler.validateServerAuthorizationCodeResponse(serverParams, cachedState, this.cryptoUtils);
        return serverParams.code;
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri
     */
    getLogoutUri(logoutRequest: EndSessionRequest): string {
        // Throw error if logoutRequest is null/undefined
        if (!logoutRequest) {
            throw ClientConfigurationError.createEmptyLogoutRequestError();
        }

        if (logoutRequest.account) {
            // Clear given account.
            this.cacheManager.removeAccount(AccountEntity.generateAccountCacheKey(logoutRequest.account));
        } else {
            // Clear all accounts and tokens
            this.cacheManager.clear();
        }

        // Get postLogoutRedirectUri.
        const postLogoutUriParam = logoutRequest.postLogoutRedirectUri ? 
            `?${AADServerParamKeys.POST_LOGOUT_URI}=${encodeURIComponent(logoutRequest.postLogoutRedirectUri)}` : "";

        const correlationIdParam = logoutRequest.correlationId ? 
            `&${AADServerParamKeys.CLIENT_REQUEST_ID}=${encodeURIComponent(logoutRequest.correlationId)}` : "";
        
        // Construct logout URI.
        const logoutUri = `${this.authority.endSessionEndpoint}${postLogoutUriParam}${correlationIdParam}`;
        return logoutUri;
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: AuthorizationCodeRequest, telemetryManager?: ServerTelemetryManager): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const requestBody = this.createTokenRequestBody(request);
        let headers: Map<string, string> = this.createDefaultTokenRequestHeaders();

        if (telemetryManager) {
            headers = telemetryManager.addTelemetryHeaders(headers);
        }

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

        const scopeSet = new ScopeSet(request.scopes || []);
        parameterBuilder.addScopes(scopeSet);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // add code_verifier if passed
        if (request.codeVerifier) {
            parameterBuilder.addCodeVerifier(request.codeVerifier);
        }

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
        parameterBuilder.addClientInfo();

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private createAuthCodeUrlQueryString(request: AuthorizationUrlRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const scopeSet = new ScopeSet(request.scopes || []);
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
}
