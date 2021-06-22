/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { CommonAuthorizationUrlRequest } from "../request/CommonAuthorizationUrlRequest";
import { CommonAuthorizationCodeRequest } from "../request/CommonAuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { GrantType, AuthenticationScheme, PromptValue } from "../utils/Constants";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { NetworkResponse } from "../network/NetworkManager";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";
import { UrlString } from "../url/UrlString";
import { ServerAuthorizationCodeResponse } from "../response/ServerAuthorizationCodeResponse";
import { AccountEntity } from "../cache/entities/AccountEntity";
import { CommonEndSessionRequest } from "../request/CommonEndSessionRequest";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { AuthorizationCodePayload } from "../response/AuthorizationCodePayload";
import { TimeUtils } from "../utils/TimeUtils";
import { TokenClaims } from "../account/TokenClaims";
import { AccountInfo } from "../account/AccountInfo";

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
    async getAuthCodeUrl(request: CommonAuthorizationUrlRequest): Promise<string> {
        const queryString = this.createAuthCodeUrlQueryString(request);

        return UrlString.appendQueryString(this.authority.authorizationEndpoint, queryString);
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireToken(request: CommonAuthorizationCodeRequest, authCodePayload?: AuthorizationCodePayload): Promise<AuthenticationResult> {
        this.logger.info("in acquireToken call");
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
        return await responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, authCodePayload);
    }

    /**
     * Handles the hash fragment response from public client code request. Returns a code response used by
     * the client to exchange for a token in acquireToken.
     * @param hashFragment
     */
    handleFragmentResponse(hashFragment: string, cachedState: string): AuthorizationCodePayload {
        // Handle responses.
        const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, null, null);

        // Deserialize hash fragment response parameters.
        const hashUrlString = new UrlString(hashFragment);
        // Deserialize hash fragment response parameters.
        const serverParams: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(hashUrlString.getHash());

        // Get code response
        responseHandler.validateServerAuthorizationCodeResponse(serverParams, cachedState, this.cryptoUtils);

        // throw when there is no auth code in the response
        if (!serverParams.code) {
            throw ClientAuthError.createNoAuthCodeInServerResponseError();
        }

        return {
            ...serverParams,
            // Code param is optional in ServerAuthorizationCodeResponse but required in AuthorizationCodePaylod
            code: serverParams.code
        };
    }

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri
     */
    getLogoutUri(logoutRequest: CommonEndSessionRequest): string {
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

        const queryString = this.createLogoutUrlQueryString(logoutRequest);

        // Construct logout URI.
        return StringUtils.isEmpty(queryString) ? this.authority.endSessionEndpoint : `${this.authority.endSessionEndpoint}?${queryString}`;
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: CommonAuthorizationCodeRequest): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes
        };

        const requestBody = await this.createTokenRequestBody(request);
        const queryParameters = this.createTokenQueryParameters(request);
        const headers: Record<string, string> = this.createDefaultTokenRequestHeaders();

        const endpoint = StringUtils.isEmpty(queryParameters) ? authority.tokenEndpoint : `${authority.tokenEndpoint}?${queryParameters}`;

        return this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint);
    }

    /**
     * Creates query string for the /token request
     * @param request 
     */
    private createTokenQueryParameters(request: CommonAuthorizationCodeRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.tokenQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.tokenQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private async createTokenRequestBody(request: CommonAuthorizationCodeRequest): Promise<string> {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri);

        // Add scope array, parameter builder will add default scopes and dedupe
        parameterBuilder.addScopes(request.scopes);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // Add library metadata
        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        parameterBuilder.addThrottling();
        
        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

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

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const cnfString = await this.keyManager.generateCnf(request);
            parameterBuilder.addPopToken(cnfString);
        }

        if (request.stkJwk) {
            const stkJwk = await this.keyManager.retrieveAsymmetricPublicKey(request.stkJwk);
            parameterBuilder.addStkJwk(stkJwk);
        }

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private createAuthCodeUrlQueryString(request: CommonAuthorizationUrlRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const requestScopes = [...request.scopes || [], ...request.extraScopesToConsent || []];
        parameterBuilder.addScopes(requestScopes);

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
        if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
            // AAD will throw if prompt=select_account is passed with an account hint
            if (request.sid && request.prompt === PromptValue.NONE) {
                // SessionID is only used in silent calls
                this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request");
                parameterBuilder.addSid(request.sid);
            } else if (request.account) {
                const accountSid = this.extractAccountSid(request.account);
                // If account and loginHint are provided, we will check account first for sid before adding loginHint
                if (accountSid && request.prompt === PromptValue.NONE) {
                    // SessionId is only used in silent calls
                    this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account");
                    parameterBuilder.addSid(accountSid);
                } else if (request.loginHint) {
                    this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request");
                    parameterBuilder.addLoginHint(request.loginHint);
                } else if (request.account.username) {
                    // Fallback to account username if provided
                    this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account");
                    parameterBuilder.addLoginHint(request.account.username);
                }
            } else if (request.loginHint) {
                this.logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request");
                parameterBuilder.addLoginHint(request.loginHint);
            }
        } else {
            this.logger.verbose("createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints");
        }

        if (request.nonce) {
            parameterBuilder.addNonce(request.nonce);
        }

        if (request.state) {
            parameterBuilder.addState(request.state);
        }

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        if (request.stkJwk) {
            parameterBuilder.addStkJwkThumbprint(request.stkJwk);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `EndSessionRequest` and creates a URL
     * @param request
     */
    private createLogoutUrlQueryString(request: CommonEndSessionRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.postLogoutRedirectUri) {
            parameterBuilder.addPostLogoutRedirectUri(request.postLogoutRedirectUri);
        }

        if (request.correlationId) {
            parameterBuilder.addCorrelationId(request.correlationId);
        }

        if (request.idTokenHint) {
            parameterBuilder.addIdTokenHint(request.idTokenHint);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Helper to get sid from account. Returns null if idTokenClaims are not present or sid is not present.
     * @param account 
     */
    private extractAccountSid(account: AccountInfo): string | null {
        if (account.idTokenClaims) {
            const tokenClaims = account.idTokenClaims as TokenClaims;
            return tokenClaims.sid || null;
        }
        return null;
    }
}
