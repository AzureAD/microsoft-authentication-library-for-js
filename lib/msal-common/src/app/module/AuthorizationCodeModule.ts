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
import { TokenResponse } from "../../response/TokenResponse";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
import { ServerCodeRequestParameters } from "../../server/ServerCodeRequestParameters";
import { CodeResponse } from "../../response/CodeResponse";
import { ClientAuthError } from "../../error/ClientAuthError";
import { TemporaryCacheKeys, PersistentCacheKeys, AADServerParamKeys } from "../../utils/Constants";
import { ServerTokenRequestParameters } from "../../server/ServerTokenRequestParameters";
import { ServerAuthorizationTokenResponse, validateServerAuthorizationTokenResponse } from "../../server/ServerAuthorizationTokenResponse";
import { ResponseHandler } from "../../response/ResponseHandler";
import { AccessTokenCacheItem } from "../../cache/AccessTokenCacheItem";
import { ScopeSet } from "../../auth/ScopeSet";
import { TimeUtils } from "../../utils/TimeUtils";
import { IdToken } from "../../auth/IdToken";
import { StringUtils } from "../../utils/StringUtils";
import { TokenRenewParameters } from "../../request/TokenRenewParameters";
import { ServerAuthorizationCodeResponse } from "../../server/ServerAuthorizationCodeResponse";
import { UrlString } from "../../url/UrlString";

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
            systemOptions: configuration.systemOptions,
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        this.clientConfig = buildPublicClientSPAConfiguration(configuration);
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.clientConfig.auth.authority || AuthorityFactory.DEFAULT_AUTHORITY, this.networkClient);
    }

    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        return this.createUrl(request, true);
    }

    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        return this.createUrl(request, false);
    }

    private async createUrl(request: AuthenticationParameters, isLoginCall: boolean): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }

        // Create and validate request parameters
        let requestParameters: ServerCodeRequestParameters;
        try {
            requestParameters = new ServerCodeRequestParameters(
                acquireTokenAuthority,
                this.clientConfig.auth.clientId,
                request,
                this.getAccount(),
                this.getRedirectUri(),
                this.cryptoObj,
                isLoginCall
            );

            // Check for SSO
            let adalIdToken: IdToken;
            if (!requestParameters.isSSOParam()) {
                const adalIdTokenString = this.cacheStorage.getItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                if (!StringUtils.isEmpty(adalIdTokenString)) {
                    adalIdToken = new IdToken(adalIdTokenString, this.cryptoObj);
                    this.cacheStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                }
            }

            // Update required cache entries for request
            this.cacheManager.updateCacheEntries(requestParameters, request.account);

            // Populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
            requestParameters.populateQueryParams(adalIdToken);

            const urlNavigate = await requestParameters.createNavigateUrl();

            // Cache token request
            const tokenRequest: TokenExchangeParameters = {
                scopes: requestParameters.scopes.getOriginalScopesAsArray(),
                resource: request.resource,
                codeVerifier: requestParameters.generatedPkce.verifier,
                extraQueryParameters: request.extraQueryParameters,
                authority: requestParameters.authorityInstance.canonicalAuthority,
                correlationId: requestParameters.correlationId
            };

            this.cacheStorage.setItem(TemporaryCacheKeys.REQUEST_PARAMS, this.cryptoObj.base64Encode(JSON.stringify(tokenRequest)));
            return urlNavigate;
        } catch (e) {
            this.cacheManager.resetTempCacheItems(requestParameters && requestParameters.state);
            throw e;
        }
    }

    async acquireToken(codeResponse: CodeResponse): Promise<TokenResponse> {
        try {
            const tokenRequest: TokenExchangeParameters = this.getCachedRequest();

            if (!codeResponse || !codeResponse.code) {
                throw ClientAuthError.createTokenRequestCannotBeMadeError();
            }

            const authorityKey: string = this.cacheManager.generateAuthorityKey(codeResponse.userRequestState);
            const cachedAuthority: string = this.cacheStorage.getItem(authorityKey);
            tokenRequest.authority = cachedAuthority;

            const acquireTokenAuthority = (tokenRequest && tokenRequest.authority) ? AuthorityFactory.createInstance(tokenRequest.authority, this.networkClient) : this.defaultAuthorityInstance;
            if (!acquireTokenAuthority.discoveryComplete()) {
                try {
                    await acquireTokenAuthority.resolveEndpointsAsync();
                } catch (e) {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
                }
            }

            const { tokenEndpoint } = acquireTokenAuthority;
            const tokenReqParams = new ServerTokenRequestParameters(
                this.clientConfig.auth.clientId,
                tokenRequest,
                codeResponse,
                this.getRedirectUri(),
                this.cryptoObj
            );

            return this.getTokenResponse(tokenEndpoint, tokenReqParams, tokenRequest, codeResponse);
        } catch (e) {
            this.cacheManager.resetTempCacheItems(codeResponse && codeResponse.userRequestState);
            this.account = null;
            throw e;
        }
    }

    async renewToken(request: TokenRenewParameters): Promise<TokenResponse> {
        try {
            if (!request) {
                throw ClientAuthError.createEmptyTokenRequestError();
            }

            const account = request.account || this.getAccount();
            const requestScopes = new ScopeSet(request.scopes, this.clientConfig.auth.clientId, true);
            if (requestScopes.isLoginScopeSet()) {
                // Check for login if id token is being renewed
                if (!account) {
                    throw ClientAuthError.createUserLoginRequiredError();
                }
            }

            const acquireTokenAuthority = request.authority ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
            if (!acquireTokenAuthority.discoveryComplete()) {
                try {
                    await acquireTokenAuthority.resolveEndpointsAsync();
                } catch (e) {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
                }
            }

            const cachedTokenItem = this.getCachedTokens(requestScopes, acquireTokenAuthority.canonicalAuthority, request.resource, account && account.homeAccountIdentifier);
            const expirationSec = Number(cachedTokenItem.value.expiresOnSec);
            const offsetCurrentTimeSec = TimeUtils.nowSeconds() + this.clientConfig.systemOptions.tokenRenewalOffsetSeconds;
            if (!request.forceRefresh && expirationSec && expirationSec > offsetCurrentTimeSec) {
                const cachedScopes = ScopeSet.fromString(cachedTokenItem.key.scopes, this.clientConfig.auth.clientId, true);
                const defaultTokenResponse: TokenResponse = {
                    uniqueId: "",
                    tenantId: "",
                    scopes: cachedScopes.asArray(),
                    tokenType: cachedTokenItem.value.tokenType,
                    idToken: "",
                    idTokenClaims: null,
                    accessToken: cachedTokenItem.value.accessToken,
                    refreshToken: cachedTokenItem.value.refreshToken,
                    expiresOn: new Date(expirationSec * 1000),
                    account: account,
                    userRequestState: ""
                };

                return StringUtils.isEmpty(cachedTokenItem.value.idToken) ? defaultTokenResponse : 
                    ResponseHandler.setResponseIdToken(defaultTokenResponse, new IdToken(cachedTokenItem.value.idToken, this.cryptoObj));
            } else {
                request.authority = cachedTokenItem.key.authority;
                const { tokenEndpoint } = acquireTokenAuthority;
                const tokenReqParams = new ServerTokenRequestParameters(
                    this.clientConfig.auth.clientId,
                    request,
                    null,
                    this.getRedirectUri(),
                    this.cryptoObj,
                    cachedTokenItem.value.refreshToken
                );

                return this.getTokenResponse(tokenEndpoint, tokenReqParams, request);
            }
        } catch (e) {
            this.cacheManager.resetTempCacheItems();
            this.account = null;
            throw e;
        }
    }

    // #region Logout

    async logout(authorityUri?: string): Promise<string> {
        const homeAccountIdentifier = this.account ? this.account.homeAccountIdentifier : "";
        this.cacheManager.removeAllAccessTokens(this.clientConfig.auth.clientId, authorityUri, "", homeAccountIdentifier);
        this.cacheStorage.clear();
        this.account = null;
        let postLogoutRedirectUri = "";
        try {
            postLogoutRedirectUri = `?${AADServerParamKeys.POST_LOGOUT_URI}=` + encodeURIComponent(this.getPostLogoutRedirectUri());
        } catch (e) {}

        const acquireTokenAuthority = (authorityUri) ? AuthorityFactory.createInstance(authorityUri, this.networkClient) : this.defaultAuthorityInstance;
        if (!acquireTokenAuthority.discoveryComplete()) {
            try {
                await acquireTokenAuthority.resolveEndpointsAsync();
            } catch (e) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
            }
        }

        const logoutUri = `${acquireTokenAuthority.endSessionEndpoint}${postLogoutRedirectUri}`;
        return logoutUri;
    }

    // #endregion

    // #region Response Handling

    public handleFragmentResponse(hashFragment: string): CodeResponse {
        const responseHandler = new ResponseHandler(this.clientConfig.auth.clientId, this.cacheStorage, this.cacheManager, this.cryptoObj, this.logger);
        // Deserialize hash fragment response parameters
        const hashUrlString = new UrlString(hashFragment);
        const serverParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        return responseHandler.handleServerCodeResponse(serverParams);
    }

    // #endregion

    // #region Helpers

    private getCachedRequest(): TokenExchangeParameters {
        try {
            const encodedTokenRequest = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_PARAMS);
            const parsedRequest = JSON.parse(this.cryptoObj.base64Decode(encodedTokenRequest)) as TokenExchangeParameters;
            this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
            return parsedRequest;
        } catch (err) {
            throw ClientAuthError.createTokenRequestCacheError(err);
        }
    }

    private getCachedTokens(requestScopes: ScopeSet, authorityUri: string, resourceId: string, homeAccountIdentifier: string): AccessTokenCacheItem {
        const tokenCacheItems: Array<AccessTokenCacheItem> = this.cacheManager.getAllAccessTokens(this.clientConfig.auth.clientId, authorityUri || "", resourceId || "", homeAccountIdentifier || "");
        if (tokenCacheItems.length === 0) {
            throw ClientAuthError.createNoTokensFoundError(requestScopes.printScopes());
        }

        const filteredCacheItems: Array<AccessTokenCacheItem> = tokenCacheItems.filter(cacheItem => {
            const cachedScopes = ScopeSet.fromString(cacheItem.key.scopes, this.clientConfig.auth.clientId, true);
            return cachedScopes.containsScopeSet(requestScopes);
        });

        if (filteredCacheItems.length > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError(requestScopes.printScopes());
        } else if (filteredCacheItems.length === 1) {
            return filteredCacheItems[0];
        } 
        throw ClientAuthError.createNoTokensFoundError(requestScopes.printScopes());
    }

    private async getTokenResponse(tokenEndpoint: string, tokenReqParams: ServerTokenRequestParameters, tokenRequest: TokenExchangeParameters, codeResponse?: CodeResponse): Promise<TokenResponse> {
        const acquiredTokenResponse = await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(
            tokenEndpoint,
            {
                body: tokenReqParams.createRequestBody(),
                headers: tokenReqParams.createRequestHeaders()
            }
        );

        validateServerAuthorizationTokenResponse(acquiredTokenResponse);
        const responseHandler = new ResponseHandler(this.clientConfig.auth.clientId, this.cacheStorage, this.cacheManager, this.cryptoObj, this.logger);
        const tokenResponse = responseHandler.createTokenResponse(acquiredTokenResponse, tokenRequest.authority, tokenRequest.resource, codeResponse && codeResponse.userRequestState);
        this.account = tokenResponse.account;
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
