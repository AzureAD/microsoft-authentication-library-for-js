/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// inheritance
import { AuthModule } from "./AuthModule";
// app
import { PublicClientSPAConfiguration, buildPublicClientSPAConfiguration } from "../config/PublicClientSPAConfiguration";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
// response
import { TokenResponse, setResponseIdToken } from "../../response/TokenResponse";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
import { ServerCodeRequestParameters } from "../../server/ServerCodeRequestParameters";
import { CodeResponse } from "../../response/CodeResponse";
import { UrlString } from "../../url/UrlString";
import { ServerAuthorizationCodeResponse, validateServerAuthorizationCodeResponse } from "../../server/ServerAuthorizationCodeResponse";
import { ClientAuthError, ClientAuthErrorMessage } from "../../error/ClientAuthError";
import { ProtocolUtils } from "../../utils/ProtocolUtils";
import { TemporaryCacheKeys, PersistentCacheKeys } from "../../utils/Constants";
import { AuthError } from "../../error/AuthError";
import { ServerTokenRequestParameters } from "../../server/ServerTokenRequestParameters";
import { ServerAuthorizationTokenResponse, validateServerAuthorizationTokenResponse } from "../../server/ServerAuthorizationTokenResponse";
import { IdToken } from "../../auth/IdToken";
import { buildClientInfo } from "../../auth/ClientInfo";
import { Account } from "../../auth/Account";
import { ScopeSet } from "../../auth/ScopeSet";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * 
 */
export class AuthorizationCodeModule extends AuthModule {

    // Application config
    private clientConfig: PublicClientSPAConfiguration;

    constructor(configuration: PublicClientSPAConfiguration) {
        super({
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        this.clientConfig = buildPublicClientSPAConfiguration(configuration);
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.clientConfig.auth.authority || AuthorityFactory.DEFAULT_AUTHORITY, this.networkClient);
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        await acquireTokenAuthority.resolveEndpointsAsync();

        // Create and validate request parameters
        const requestParameters = new ServerCodeRequestParameters(
            acquireTokenAuthority,
            this.clientConfig.auth.clientId,
            request,
            this.getRedirectUri(),
            this.cryptoObj,
            true
        );

        // Check for SSO
        if (!requestParameters.isSSOParam(this.getAccount())) {
            // TODO: Check for ADAL SSO
        }

        // Update required cache entries for request
        this.cacheManager.updateCacheEntries(requestParameters, request.account);

        // Populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
        requestParameters.populateQueryParams();

        const urlNavigate = await requestParameters.createNavigateUrl();

        // Cache token request
        const tokenRequest: TokenExchangeParameters = {
            scopes: requestParameters.scopes.getOriginalScopesAsArray(),
            resource: request.resource,
            codeVerifier: requestParameters.generatedPkce.verifier,
            extraQueryParameters: request.extraQueryParameters,
            authority: requestParameters.authorityInstance.canonicalAuthority,
            correlationId: requestParameters.correlationId,
            userRequestState: ProtocolUtils.getUserRequestState(requestParameters.state)
        };

        this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, this.cryptoObj.base64Encode(JSON.stringify(tokenRequest)));

        return urlNavigate;
    }

    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        throw new Error("Method not implemented.");
    }

    async acquireTokenAuto(codeResponse: CodeResponse): Promise<TokenResponse> {
        if (!codeResponse || !codeResponse.code) {
            throw ClientAuthError.createAuthCodeNullOrEmptyError();
        }

        const encodedTokenRequest = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_PARAMS);
        try {
            const tokenRequest = JSON.parse(this.cryptoObj.base64Decode(encodedTokenRequest)) as TokenExchangeParameters;
            tokenRequest.code = codeResponse.code;
            tokenRequest.userRequestState = codeResponse.userRequestState;
            this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
            return this.acquireToken(tokenRequest);
        } catch (err) {
            throw err;
        }        
    }

    async acquireToken(request: TokenExchangeParameters): Promise<TokenResponse> {
        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;

        let tokenEndpoint: string;
        try {
            tokenEndpoint = acquireTokenAuthority.tokenEndpoint;
        } catch (e) {
            const authErr: AuthError = e;
            if (authErr.errorCode === ClientAuthErrorMessage.endpointResolutionError.code) {
                await acquireTokenAuthority.resolveEndpointsAsync();
                tokenEndpoint = acquireTokenAuthority.tokenEndpoint;
            } else {
                throw authErr;
            }
        }

        const tokenReqParams = new ServerTokenRequestParameters(
            this.clientConfig.auth.clientId,
            request,
            this.getRedirectUri(),
            this.cryptoObj
        );

        const acquiredTokenResponse = await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(
            tokenEndpoint,
            {
                body: await tokenReqParams.createRequestBody(),
                headers: tokenReqParams.createRequestHeaders()
            }
        );

        try {
            validateServerAuthorizationTokenResponse(acquiredTokenResponse);
        } catch (e) {
            this.cacheManager.resetTempCacheItems(tokenReqParams.state);
            throw e;
        }

        return this.createTokenResponse(acquiredTokenResponse, tokenReqParams.state);
    }

    // #region Response Handling

    public handleFragmentResponse(hashFragment: string): CodeResponse {
        // Deserialize and validate hash fragment response parameters
        const hashUrlString = new UrlString(hashFragment);
        const hashParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        try {
            validateServerAuthorizationCodeResponse(hashParams, this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE), this.cryptoObj);
        } catch(e) {
            this.cacheManager.resetTempCacheItems(hashParams && hashParams.state);
            throw e;
        }

        // Cache client info
        this.cacheStorage.setItem(PersistentCacheKeys.CLIENT_INFO, hashParams.client_info);

        // Create response object
        const response: CodeResponse = {
            code: hashParams.code,
            userRequestState: hashParams.state
        };

        return response;
    }

    private createTokenResponse(serverTokenResponse: ServerAuthorizationTokenResponse, state: string): TokenResponse {
        let tokenResponse: TokenResponse = {
            uniqueId: "",
            tenantId: "",
            tokenType: "",
            idToken: null,
            idTokenClaims: null,
            accessToken: "",
            refreshToken: "",
            scopes: [],
            expiresOn: null,
            account: null,
            userRequestState: ""
        };
        // Set consented scopes in response
        const requestScopes = ScopeSet.fromString(serverTokenResponse.scope, this.clientConfig.auth.clientId, false);
        tokenResponse.scopes = requestScopes.asArray();

        // Retrieve current id token object
        let idTokenObj: IdToken;
        const cachedIdToken: string = this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN);
        if (serverTokenResponse.id_token) {
            idTokenObj = new IdToken(serverTokenResponse.id_token, this.cryptoObj);
            tokenResponse = setResponseIdToken(tokenResponse, idTokenObj);
        } else if (cachedIdToken) {
            idTokenObj = new IdToken(cachedIdToken, this.cryptoObj);
            tokenResponse = setResponseIdToken(tokenResponse, idTokenObj);
        } else {
            // TODO: No account scenario?
        }

        // check nonce integrity if idToken has nonce - throw an error if not matched
        const nonce = this.cacheStorage.getItem(`${TemporaryCacheKeys.NONCE_IDTOKEN}|${state}`);

        if (!idTokenObj || !idTokenObj.claims.nonce) {
            throw ClientAuthError.createInvalidIdTokenError(idTokenObj);
        }

        if (idTokenObj.claims.nonce !== nonce) {
            this.account = null;
            throw ClientAuthError.createNonceMismatchError();
        }

        // TODO: This will be used when saving tokens
        // const authorityKey: string = this.cacheManager.generateAuthorityKey(state);
        // const cachedAuthority: string = this.cacheStorage.getItem(authorityKey);

        // TODO: Save id token here
        
        // Retrieve client info
        const clientInfo = buildClientInfo(this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO), this.cryptoObj);

        // Create account object for request
        this.account = Account.createAccount(idTokenObj, clientInfo, this.cryptoObj);
        tokenResponse.account = this.account;

        // Set token type
        tokenResponse.tokenType = serverTokenResponse.token_type;

        // Save the access token if it exists
        if (serverTokenResponse.access_token) {
            const accountKey = this.cacheManager.generateAcquireTokenAccountKey(this.account.homeAccountIdentifier);
            
            const cachedAccount = JSON.parse(this.cacheStorage.getItem(accountKey)) as Account;

            if (!cachedAccount || Account.compareAccounts(cachedAccount, this.account)) {
                tokenResponse.accessToken = serverTokenResponse.access_token;
                tokenResponse.refreshToken = serverTokenResponse.refresh_token;
                // TODO: Save the access token
            } else {
                throw ClientAuthError.createAccountMismatchError();
            }
        }

        // Return user set state in the response
        tokenResponse.userRequestState = ProtocolUtils.getUserRequestState(state);
        return tokenResponse;
    }

    // #endregion

    // #region Getters and setters

    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * Evaluates redirectUri if its a function, otherwise simply returns its value.
     * @returns {string} redirect URL
     *
     */
    public getRedirectUri(): string {
        if (this.clientConfig.auth.redirectUri) {
            if (typeof this.clientConfig.auth.redirectUri === "function") {
                return this.clientConfig.auth.redirectUri();
            }
            return this.clientConfig.auth.redirectUri;
        } else {
            throw ClientConfigurationError.createRedirectUriEmptyError();
        }
    }

    /**
     * Use to get the post logout redirect uri configured in MSAL or null.
     * Evaluates postLogoutredirectUri if its a function, otherwise simply returns its value.
     *
     * @returns {string} post logout redirect URL
     */
    public getPostLogoutRedirectUri(): string {
        if (this.clientConfig.auth.postLogoutRedirectUri) {
            if (typeof this.clientConfig.auth.postLogoutRedirectUri === "function") {
                return this.clientConfig.auth.postLogoutRedirectUri();
            }
            return this.clientConfig.auth.postLogoutRedirectUri;
        } else {
            throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
        }
    }

    // #endregion
}
