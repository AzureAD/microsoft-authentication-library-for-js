/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthModule } from "./AuthModule";
import { PublicClientSPAConfiguration, buildPublicClientSPAConfiguration } from "../config/PublicClientSPAConfiguration";
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { TokenExchangeParameters } from "../../request/TokenExchangeParameters";
import { TokenRenewParameters } from "../../request/TokenRenewParameters";
import { ServerCodeRequestParameters } from "../../server/ServerCodeRequestParameters";
import { ServerTokenRequestParameters } from "../../server/ServerTokenRequestParameters";
import { CodeResponse } from "../../response/CodeResponse";
import { TokenResponse } from "../../response/TokenResponse";
import { ResponseHandler } from "../../response/ResponseHandler";
import { ServerAuthorizationCodeResponse } from "../../server/ServerAuthorizationCodeResponse";
import { ServerAuthorizationTokenResponse } from "../../server/ServerAuthorizationTokenResponse";
import { ClientAuthError } from "../../error/ClientAuthError";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { AccessTokenCacheItem } from "../../cache/AccessTokenCacheItem";
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
import { IdToken } from "../../auth/IdToken";
import { ScopeSet } from "../../auth/ScopeSet";
import { TemporaryCacheKeys, PersistentCacheKeys, AADServerParamKeys, Constants, MsalMethod } from "../../utils/Constants";
import { TimeUtils } from "../../utils/TimeUtils";
import { StringUtils } from "../../utils/StringUtils";
import { UrlString } from "../../url/UrlString";

/**
 * AuthorizationCodeModule class
 * 
 * Object instance which will construct requests to send to and handle responses
 * from the Microsoft STS using the authorization code flow. 
 */
export class AuthorizationCodeModule extends AuthModule {

    // Application config
    private clientConfig: PublicClientSPAConfiguration;

    constructor(configuration: PublicClientSPAConfiguration) {
        // Implement base module
        super({
            systemOptions: configuration.systemOptions,
            loggerOptions: configuration.loggerOptions,
            storageInterface: configuration.storageInterface,
            networkInterface: configuration.networkInterface,
            cryptoInterface: configuration.cryptoInterface
        });
        // Implement defaults in config
        this.clientConfig = buildPublicClientSPAConfiguration(configuration);

        // Initialize default authority instance
        this.defaultAuthorityInstance = AuthorityFactory.createInstance(this.clientConfig.auth.authority || Constants.DEFAULT_AUTHORITY, this.networkClient);
    }

    /**
     * Creates a url for logging in a user. This will by default append the client id to the list of scopes, 
     * allowing you to retrieve an id token in the subsequent code exchange. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request 
     */
    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        return this.createUrl(request, true);
    }

    /**
     * Creates a url for logging in a user. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request 
     */
    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        return this.createUrl(request, false);
    }

    /**
     * Helper function which creates URL. If isLoginCall is true, MSAL appends client id scope to retrieve id token from the service.
     * @param request 
     * @param isLoginCall 
     */
    private async createUrl(request: AuthenticationParameters, isLoginCall: boolean): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }

        // Create and validate request parameters.
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

            // Check for SSO.
            let adalIdToken: IdToken = null;
            if (!requestParameters.hasSSOParam()) {
                // Only check for adal token if no SSO params are being used
                const adalIdTokenString = this.cacheStorage.getItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                if (!StringUtils.isEmpty(adalIdTokenString)) {
                    adalIdToken = new IdToken(adalIdTokenString, this.cryptoObj);
                    this.cacheStorage.removeItem(PersistentCacheKeys.ADAL_ID_TOKEN);
                }
            }

            // Update required cache entries for request.
            this.cacheManager.updateCacheEntries(requestParameters, request.account);

            // Populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer.
            requestParameters.populateQueryParams(adalIdToken);

            // Create url to navigate to.
            const urlNavigate = await requestParameters.createNavigateUrl();

            // Cache token request.
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
            // Reset cache items before re-throwing.
            this.cacheManager.resetTempCacheItems(requestParameters && requestParameters.state);
            throw e;
        }
    }

    /**
     * Given an authorization code, it will perform a token exchange using cached values from a previous call to
     * createLoginUrl() or createAcquireTokenUrl(). You must call this AFTER using one of those APIs first. You should
     * also use the handleFragmentResponse() API to pass the codeResponse to this function afterwards.
     * @param codeResponse 
     */
    async acquireToken(codeResponse: CodeResponse): Promise<TokenResponse> {
        try {
            // If no code response is given, we cannot acquire a token.
            if (!codeResponse || StringUtils.isEmpty(codeResponse.code)) {
                throw ClientAuthError.createTokenRequestCannotBeMadeError();
            }

            // Get request from cache
            const tokenRequest: TokenExchangeParameters = this.getCachedRequest(codeResponse.userRequestState);

            // Initialize authority or use default, and perform discovery endpoint check.
            const acquireTokenAuthority = (tokenRequest && tokenRequest.authority) ? AuthorityFactory.createInstance(tokenRequest.authority, this.networkClient) : this.defaultAuthorityInstance;
            if (!acquireTokenAuthority.discoveryComplete()) {
                try {
                    await acquireTokenAuthority.resolveEndpointsAsync();
                } catch (e) {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
                }
            }

            // Get token endpoint.
            const { tokenEndpoint } = acquireTokenAuthority;
            // Initialize request parameters.
            const tokenReqParams = new ServerTokenRequestParameters(
                this.clientConfig.auth.clientId,
                tokenRequest,
                codeResponse,
                this.getRedirectUri(),
                this.cryptoObj
            );

            // User helper to retrieve token response.
            // Need to await function call before return to catch any thrown errors.
            // if errors are thrown asynchronously in return statement, they are caught by caller of this function instead.
            return await this.getTokenResponse(tokenEndpoint, tokenReqParams, tokenRequest, codeResponse);
        } catch (e) {
            // Reset cache items and set account to null before re-throwing.
            this.cacheManager.resetTempCacheItems(codeResponse && codeResponse.userRequestState);
            this.account = null;
            throw e;
        }
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token. Will throw an error if login is not completed (unless
     * id tokens are not being renewed).
     * @param request 
     */
    async renewToken(request: TokenRenewParameters): Promise<TokenResponse> {
        try {
            // Cannot renew token if no request object is given.
            if (!request) {
                throw ClientConfigurationError.createEmptyTokenRequestError();
            }

            // Get account object for this request.
            const account = request.account || this.getAccount();
            const requestScopes = new ScopeSet(request.scopes || [], this.clientConfig.auth.clientId, true);
            // If this is an id token renewal, and no account is present, throw an error.
            if (requestScopes.isLoginScopeSet()) {
                if (!account) {
                    throw ClientAuthError.createUserLoginRequiredError();
                }
            }

            // Initialize authority or use default, and perform discovery endpoint check.
            const acquireTokenAuthority = request.authority ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
            if (!acquireTokenAuthority.discoveryComplete()) {
                try {
                    await acquireTokenAuthority.resolveEndpointsAsync();
                } catch (e) {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
                }
            }

            // Get current cached tokens
            const cachedTokenItem = this.getCachedTokens(requestScopes, acquireTokenAuthority.canonicalAuthority, request.resource, account && account.homeAccountIdentifier);
            const expirationSec = Number(cachedTokenItem.value.expiresOnSec);
            const offsetCurrentTimeSec = TimeUtils.nowSeconds() + this.clientConfig.systemOptions.tokenRenewalOffsetSeconds;
            // Check if refresh is forced, or if tokens are expired. If neither are true, return a token response with the found token entry.
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
                    userRequestState: MsalMethod.SILENT
                };

                // Only populate id token if it exists in cache item.
                return StringUtils.isEmpty(cachedTokenItem.value.idToken) ? defaultTokenResponse : 
                    ResponseHandler.setResponseIdToken(defaultTokenResponse, new IdToken(cachedTokenItem.value.idToken, this.cryptoObj));
            } else {
                // Renew the tokens.
                request.authority = cachedTokenItem.key.authority;
                const { tokenEndpoint } = acquireTokenAuthority;

                // Build CodeResponse containing state
                const codeResponse = {
                    code: "",
                    userRequestState: MsalMethod.SILENT
                };

                // Initialize request parameters.
                const tokenReqParams = new ServerTokenRequestParameters(
                    this.clientConfig.auth.clientId,
                    request,
                    codeResponse,
                    this.getRedirectUri(),
                    this.cryptoObj,
                    cachedTokenItem.value.refreshToken
                );

                // User helper to retrieve token response.
                // Need to await function call before return to catch any thrown errors.
                // if errors are thrown asynchronously in return statement, they are caught by caller of this function instead.
                return await this.getTokenResponse(tokenEndpoint, tokenReqParams, request);
            }
        } catch (e) {
            // Reset cache items and set account to null before re-throwing.
            this.cacheManager.resetTempCacheItems();
            this.account = null;
            throw e;
        }
    }

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri 
     */
    async logout(authorityUri?: string): Promise<string> {
        const currentAccount = this.getAccount();
        // Check for homeAccountIdentifier. Do not send anything if it doesn't exist.
        const homeAccountIdentifier = currentAccount ? currentAccount.homeAccountIdentifier : "";
        // Remove all pertinent access tokens.
        this.cacheManager.removeAllAccessTokens(this.clientConfig.auth.clientId, authorityUri, "", homeAccountIdentifier);
        // Clear remaining cache items.
        this.cacheStorage.clear();
        // Clear current account.
        this.account = null;
        // Get postLogoutRedirectUri.
        let postLogoutRedirectUri = "";
        try {
            postLogoutRedirectUri = `?${AADServerParamKeys.POST_LOGOUT_URI}=` + encodeURIComponent(this.getPostLogoutRedirectUri());
        } catch (e) {}

        // Acquire token authorities.
        const acquireTokenAuthority = (authorityUri) ? AuthorityFactory.createInstance(authorityUri, this.networkClient) : this.defaultAuthorityInstance;
        if (!acquireTokenAuthority.discoveryComplete()) {
            try {
                await acquireTokenAuthority.resolveEndpointsAsync();
            } catch (e) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
            }
        }

        // Construct logout URI.
        const logoutUri = `${acquireTokenAuthority.endSessionEndpoint}${postLogoutRedirectUri}`;
        return logoutUri;
    }

    // #endregion

    // #region Response Handling

    /**
     * Handles the hash fragment response from public client code request. Returns a code response used by
     * the client to exchange for a token in acquireToken.
     * @param hashFragment 
     */
    public handleFragmentResponse(hashFragment: string): CodeResponse {
        // Handle responses.
        const responseHandler = new ResponseHandler(this.clientConfig.auth.clientId, this.cacheStorage, this.cacheManager, this.cryptoObj, this.logger);
        // Deserialize hash fragment response parameters.
        const hashUrlString = new UrlString(hashFragment);
        const serverParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        // Get code response
        return responseHandler.handleServerCodeResponse(serverParams);
    }

    // #endregion

    // #region Helpers

    /**
     * Clears cache of items related to current request.
     */
    public cancelRequest(): void {
        const cachedState = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_STATE);
        this.cacheManager.resetTempCacheItems(cachedState || "");
    }

    /**
     * Gets the token exchange parameters from the cache. Throws an error if nothing is found.
     */
    private getCachedRequest(state: string): TokenExchangeParameters {
        try {
            // Get token request from cache and parse as TokenExchangeParameters.
            const encodedTokenRequest = this.cacheStorage.getItem(TemporaryCacheKeys.REQUEST_PARAMS);
            const parsedRequest = JSON.parse(this.cryptoObj.base64Decode(encodedTokenRequest)) as TokenExchangeParameters;
            this.cacheStorage.removeItem(TemporaryCacheKeys.REQUEST_PARAMS);
            // Get cached authority and use if no authority is cached with request.
            if (StringUtils.isEmpty(parsedRequest.authority)) {
                const authorityKey: string = this.cacheManager.generateAuthorityKey(state);
                const cachedAuthority: string = this.cacheStorage.getItem(authorityKey);
                parsedRequest.authority = cachedAuthority;
            }
            return parsedRequest;
        } catch (err) {
            throw ClientAuthError.createTokenRequestCacheError(err);
        }
    }

    /**
     * Gets all cached tokens based on the given criteria.
     * @param requestScopes 
     * @param authorityUri 
     * @param resourceId 
     * @param homeAccountIdentifier 
     */
    private getCachedTokens(requestScopes: ScopeSet, authorityUri: string, resourceId: string, homeAccountIdentifier: string): AccessTokenCacheItem {
        // Get all access tokens with matching authority, resource id and home account ID
        const tokenCacheItems: Array<AccessTokenCacheItem> = this.cacheManager.getAllAccessTokens(this.clientConfig.auth.clientId, authorityUri || "", resourceId || "", homeAccountIdentifier || "");
        if (tokenCacheItems.length === 0) {
            throw ClientAuthError.createNoTokensFoundError(requestScopes.printScopes());
        }

        // Filter cache items based on available scopes.
        const filteredCacheItems: Array<AccessTokenCacheItem> = tokenCacheItems.filter(cacheItem => {
            const cachedScopes = ScopeSet.fromString(cacheItem.key.scopes, this.clientConfig.auth.clientId, true);
            return cachedScopes.containsScopeSet(requestScopes);
        });

        // If cache items contains too many matching tokens, throw error.
        if (filteredCacheItems.length > 1) {
            throw ClientAuthError.createMultipleMatchingTokensInCacheError(requestScopes.printScopes());
        } else if (filteredCacheItems.length === 1) {
            // Return single cache item.
            return filteredCacheItems[0];
        }
        // If cache items are empty, throw error.
        throw ClientAuthError.createNoTokensFoundError(requestScopes.printScopes());
    }

    /**
     * Makes a request to the token endpoint with the given parameters and parses the response.
     * @param tokenEndpoint 
     * @param tokenReqParams 
     * @param tokenRequest 
     * @param codeResponse 
     */
    private async getTokenResponse(tokenEndpoint: string, tokenReqParams: ServerTokenRequestParameters, tokenRequest: TokenExchangeParameters, codeResponse?: CodeResponse): Promise<TokenResponse> {
        // Perform token request.
        const acquiredTokenResponse = await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(
            tokenEndpoint,
            {
                body: tokenReqParams.createRequestBody(),
                headers: tokenReqParams.createRequestHeaders()
            }
        );

        // Create response handler
        const responseHandler = new ResponseHandler(this.clientConfig.auth.clientId, this.cacheStorage, this.cacheManager, this.cryptoObj, this.logger);
        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateServerAuthorizationTokenResponse(acquiredTokenResponse);
        // Return token response with given parameters
        const tokenResponse = responseHandler.createTokenResponse(acquiredTokenResponse, tokenRequest.authority, tokenRequest.resource, codeResponse && codeResponse.userRequestState);
        // Set current account to received response account, if any.
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
            } else if (!StringUtils.isEmpty(this.clientConfig.auth.redirectUri)) {
                return this.clientConfig.auth.redirectUri;
            }
        } 
        // This should never throw unless window.location.href is returning empty.
        throw ClientConfigurationError.createRedirectUriEmptyError();
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
            } else if (!StringUtils.isEmpty(this.clientConfig.auth.postLogoutRedirectUri)) {
                return this.clientConfig.auth.postLogoutRedirectUri;
            }
        } 
        // This should never throw unless window.location.href is returning empty.
        throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
    }

    // #endregion
}
