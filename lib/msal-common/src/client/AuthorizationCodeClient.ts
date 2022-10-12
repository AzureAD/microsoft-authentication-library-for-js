/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { CommonAuthorizationUrlRequest } from "../request/CommonAuthorizationUrlRequest";
import { CommonAuthorizationCodeRequest } from "../request/CommonAuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { GrantType, AuthenticationScheme, PromptValue, Separators, AADServerParamKeys, HeaderNames } from "../utils/Constants";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { NetworkResponse } from "../network/NetworkManager";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";
import { UrlString } from "../url/UrlString";
import { ServerAuthorizationCodeResponse } from "../response/ServerAuthorizationCodeResponse";
import { CommonEndSessionRequest } from "../request/CommonEndSessionRequest";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { AuthorizationCodePayload } from "../response/AuthorizationCodePayload";
import { TimeUtils } from "../utils/TimeUtils";
import { AccountInfo } from "../account/AccountInfo";
import { buildClientInfoFromHomeAccountId, buildClientInfo } from "../account/ClientInfo";
import { CcsCredentialType, CcsCredential } from "../account/CcsCredential";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { RequestValidator } from "../request/RequestValidator";

/**
 * Oauth2.0 Authorization Code client
 */
export class AuthorizationCodeClient extends BaseClient {
    // Flag to indicate if client is for hybrid spa auth code redemption
    protected includeRedirectUri: boolean = true;

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
        const queryString = await this.createAuthCodeUrlQueryString(request);

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

        // Retrieve requestId from response headers
        const requestId = response.headers?.[HeaderNames.X_MS_REQUEST_ID];

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
        return await responseHandler.handleServerTokenResponse(
            response.body, 
            this.authority, 
            reqTimestamp, 
            request, 
            authCodePayload,
            undefined,
            undefined,
            undefined,
            requestId
        );
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
     * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri
     */
    getLogoutUri(logoutRequest: CommonEndSessionRequest): string {
        // Throw error if logoutRequest is null/undefined
        if (!logoutRequest) {
            throw ClientConfigurationError.createEmptyLogoutRequestError();
        }
        const queryString = this.createLogoutUrlQueryString(logoutRequest);

        // Construct logout URI
        return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
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
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid
        };

        const requestBody = await this.createTokenRequestBody(request);
        const queryParameters = this.createTokenQueryParameters(request);
        let ccsCredential: CcsCredential | undefined = undefined;
        if (request.clientInfo) {
            try {
                const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils);
                ccsCredential = {
                    credential: `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                };
            } catch (e) {
                this.logger.verbose("Could not parse client info for CCS Header: " + e);
            }
        }
        const headers: Record<string, string> = this.createTokenRequestHeaders(ccsCredential || request.ccsCredential);
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

        /*
         * For hybrid spa flow, there will be a code but no verifier
         * In this scenario, don't include redirect uri as auth code will not be bound to redirect URI
         */
        if (!this.includeRedirectUri) {
            // Just validate
            RequestValidator.validateRedirectUri(request.redirectUri);
        } else {
            // Validate and include redirect uri
            parameterBuilder.addRedirectUri(request.redirectUri);
        }

        // Add scope array, parameter builder will add default scopes and dedupe
        parameterBuilder.addScopes(request.scopes);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // Add library metadata
        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(this.config.telemetry.application);
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
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            const reqCnfData = await popTokenGenerator.generateCnf(request);
            // SPA PoP requires full Base64Url encoded req_cnf string (unhashed)
            parameterBuilder.addPopToken(reqCnfData.reqCnfString);
        } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
            if(request.sshJwk) {
                parameterBuilder.addSshJwk(request.sshJwk);
            } else {
                throw ClientConfigurationError.createMissingSshJwkError();
            }
        }

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        let ccsCred: CcsCredential | undefined = undefined;
        if (request.clientInfo) {
            try {
                const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils);
                ccsCred = {
                    credential: `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                };
            } catch (e) {
                this.logger.verbose("Could not parse client info for CCS Header: " + e);
            }
        } else {
            ccsCred = request.ccsCredential;
        }

        // Adds these as parameters in the request instead of headers to prevent CORS preflight request
        if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
            switch (ccsCred.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                    }
                    break;
                case CcsCredentialType.UPN:
                    parameterBuilder.addCcsUpn(ccsCred.credential);
                    break;
            }
        }

        if (request.tokenBodyParameters) {
            parameterBuilder.addExtraQueryParameters(request.tokenBodyParameters);
        }

        // Add hybrid spa parameters if not already provided
        if (request.enableSpaAuthorizationCode && (!request.tokenBodyParameters || !request.tokenBodyParameters[AADServerParamKeys.RETURN_SPA_CODE])) {
            parameterBuilder.addExtraQueryParameters({
                [AADServerParamKeys.RETURN_SPA_CODE]: "1"
            });
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private async createAuthCodeUrlQueryString(request: CommonAuthorizationUrlRequest): Promise<string> {
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
        parameterBuilder.addApplicationTelemetry(this.config.telemetry.application);

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

        // Add sid or loginHint with preference for login_hint claim (in request) -> sid -> loginHint (upn/email) -> username of AccountInfo object
        if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
            // AAD will throw if prompt=select_account is passed with an account hint
            if (request.sid && request.prompt === PromptValue.NONE) {
                // SessionID is only used in silent calls
                this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request");
                parameterBuilder.addSid(request.sid);
            } else if (request.account) {
                const accountSid = this.extractAccountSid(request.account);
                const accountLoginHintClaim = this.extractLoginHint(request.account);
                // If login_hint claim is present, use it over sid/username
                if (accountLoginHintClaim) {
                    this.logger.verbose("createAuthCodeUrlQueryString: login_hint claim present on account");
                    parameterBuilder.addLoginHint(accountLoginHintClaim);
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header");
                    }
                } else if (accountSid && request.prompt === PromptValue.NONE) {
                    /*
                     * If account and loginHint are provided, we will check account first for sid before adding loginHint
                     * SessionId is only used in silent calls
                     */
                    this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account");
                    parameterBuilder.addSid(accountSid);
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header");
                    }
                } else if (request.loginHint) {
                    this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request");
                    parameterBuilder.addLoginHint(request.loginHint);
                    parameterBuilder.addCcsUpn(request.loginHint);
                } else if (request.account.username) {
                    // Fallback to account username if provided
                    this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account");
                    parameterBuilder.addLoginHint(request.account.username);
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header");
                    }
                }
            } else if (request.loginHint) {
                this.logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request");
                parameterBuilder.addLoginHint(request.loginHint);
                parameterBuilder.addCcsUpn(request.loginHint);
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

        if (request.nativeBroker) {
            // signal ests that this is a WAM call
            parameterBuilder.addNativeBroker();

            // pass the req_cnf for POP
            if (request.authenticationScheme === AuthenticationScheme.POP) {
                const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
                // to reduce the URL length, it is recommended to send the hash of the req_cnf instead of the whole string
                const reqCnfData = await popTokenGenerator.generateCnf(request);
                parameterBuilder.addPopToken(reqCnfData.reqCnfHash);
            }
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

        if(request.state) {
            parameterBuilder.addState(request.state);
        }

        if (request.logoutHint) {
            parameterBuilder.addLogoutHint(request.logoutHint);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Helper to get sid from account. Returns null if idTokenClaims are not present or sid is not present.
     * @param account
     */
    private extractAccountSid(account: AccountInfo): string | null {
        return account.idTokenClaims?.sid || null;
    }

    private extractLoginHint(account: AccountInfo): string | null {
        return account.idTokenClaims?.login_hint || null;
    }
}
