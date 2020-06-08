/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { TokenResponse } from "../response/TokenResponse";
import { SPAResponseHandler } from "../response/SPAResponseHandler";
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { ClientAuthError } from "../error/ClientAuthError";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { AccessTokenCacheItem } from "../cache/AccessTokenCacheItem";
import { AuthorityFactory } from "../authority/AuthorityFactory";
import { IdToken } from "../account/IdToken";
import { ScopeSet } from "../request/ScopeSet";
import { PersistentCacheKeys, AADServerParamKeys, Constants, ResponseMode, GrantType } from "../utils/Constants";
import { TimeUtils } from "../utils/TimeUtils";
import { StringUtils } from "../utils/StringUtils";
import { UrlString } from "../url/UrlString";
import { Account } from "../account/Account";
import { buildClientInfo } from "../account/ClientInfo";
import { B2cAuthority } from "../authority/B2cAuthority";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { AuthorityType } from "../authority/AuthorityType";

/**
 * SPAClient class
 *
 * Object instance which will construct requests to send to and handle responses
 * from the Microsoft STS using the authorization code flow.
 */
export class SPAClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        // Implement base module
        super(configuration);

        B2cAuthority.setKnownAuthorities(this.config.authOptions.knownAuthorities);
    }

    /**
     * Creates a url for logging in a user. This will by default append the client id to the list of scopes,
     * allowing you to retrieve an id token in the subsequent code exchange. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request
     */
    async createLoginUrl(request: AuthorizationUrlRequest): Promise<string> {
        return this.createUrl(request, true);
    }

    /**
     * Creates a url for logging in a user. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request
     */
    async createAcquireTokenUrl(request: AuthorizationUrlRequest): Promise<string> {
        return this.createUrl(request, false);
    }

    /**
     * Helper function which creates URL. If isLoginCall is true, MSAL appends client id scope to retrieve id token from the service.
     * @param request
     * @param isLoginCall
     */
    private async createUrl(request: AuthorizationUrlRequest, isLoginCall: boolean): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthority;

        // This is temporary. Remove when ADFS is supported for browser
        if(acquireTokenAuthority.authorityType == AuthorityType.Adfs){
            throw ClientAuthError.createInvalidAuthorityTypeError(acquireTokenAuthority.canonicalAuthority);
        }

        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }

        const queryString = await this.createUrlRequestParamString(request, isLoginCall);
        return `${acquireTokenAuthority.authorizationEndpoint}?${queryString}`;
    }

    private async createUrlRequestParamString(request: AuthorizationUrlRequest, isLoginCall: boolean): Promise<string> {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addResponseTypeCode();

        // Client ID
        parameterBuilder.addClientId(this.config.authOptions.clientId);
        const scopeSet = new ScopeSet(
            request && request.scopes || [],
            this.config.authOptions.clientId,
            !isLoginCall
        );

        if (request.extraScopesToConsent) {
            scopeSet.appendScopes(request && request.extraScopesToConsent);
        }

        parameterBuilder.addScopes(scopeSet);

        parameterBuilder.addRedirectUri(this.getRedirectUri());

        const correlationId = (request && request.correlationId) || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod || `${Constants.S256_CODE_CHALLENGE_METHOD}`);

        parameterBuilder.addState(request.state);

        parameterBuilder.addNonce(request.nonce || this.config.cryptoInterface.createNewGuid());

        parameterBuilder.addClientInfo();

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        if (request && request.prompt) {
            parameterBuilder.addPrompt(request.prompt);
        }

        if (request && request.loginHint) {
            parameterBuilder.addLoginHint(request.loginHint);
        }

        if (request && request.domainHint) {
            parameterBuilder.addDomainHint(request.domainHint);
        }

        if (request && request.claims) {
            parameterBuilder.addClaims(request.claims);
        }

        parameterBuilder.addResponseMode(ResponseMode.FRAGMENT);

        if (request && request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request && request.extraQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Given an authorization code, it will perform a token exchange using cached values from a previous call to
     * createLoginUrl() or createAcquireTokenUrl(). You must call this AFTER using one of those APIs first. You should
     * also use the handleFragmentResponse() API to pass the codeResponse to this function afterwards.
     * @param codeResponse
     */
    async acquireToken(codeRequest: AuthorizationCodeRequest, userState: string, cachedNonce: string): Promise<TokenResponse> {
        // If no code response is given, we cannot acquire a token.
        if (!codeRequest || StringUtils.isEmpty(codeRequest.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority = (codeRequest && codeRequest.authority) ? AuthorityFactory.createInstance(codeRequest.authority, this.networkClient) : this.defaultAuthority;
        if (!acquireTokenAuthority.discoveryComplete()) {
            try {
                await acquireTokenAuthority.resolveEndpointsAsync();
            } catch (e) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
            }
        }

        const parameterBuilder = new RequestParameterBuilder();
        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addRedirectUri(codeRequest.redirectUri || this.getRedirectUri());

        const scopeSet = new ScopeSet(
            codeRequest.scopes || [],
            this.config.authOptions.clientId,
            true
        );
        parameterBuilder.addScopes(scopeSet);

        // add code: set by user, not validated
        parameterBuilder.addAuthorizationCode(codeRequest.code);

        parameterBuilder.addCodeVerifier(codeRequest.codeVerifier);

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);

        // Get token endpoint.
        const { tokenEndpoint } = acquireTokenAuthority;

        // User helper to retrieve token response.
        // Need to await function call before return to catch any thrown errors.
        // if errors are thrown asynchronously in return statement, they are caught by caller of this function instead.
        return await this.getTokenResponse(tokenEndpoint, parameterBuilder, acquireTokenAuthority.canonicalAuthority, userState, cachedNonce);
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token. Will throw an error if login is not completed (unless
     * id tokens are not being renewed).
     * @param request
     */
    async getValidToken(request: AuthorizationUrlRequest, requestAccount: Account, forceRefresh: boolean): Promise<TokenResponse> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        // Get account object for this request.
        const account = requestAccount || this.getAccount();
        const requestScopes = new ScopeSet(request.scopes || [], this.config.authOptions.clientId, true);
        // If this is an id token renewal, and no account is present, throw an error.
        if (requestScopes.isLoginScopeSet()) {
            if (!account) {
                throw ClientAuthError.createUserLoginRequiredError();
            }
        }

        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority = request.authority ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthority;

        // This is temporary. Remove when ADFS is supported for browser
        if(acquireTokenAuthority.authorityType == AuthorityType.Adfs){
            throw ClientAuthError.createInvalidAuthorityTypeError(acquireTokenAuthority.canonicalAuthority);
        }

        if (!acquireTokenAuthority.discoveryComplete()) {
            try {
                await acquireTokenAuthority.resolveEndpointsAsync();
            } catch (e) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
            }
        }

        // Get current cached tokens
        const cachedTokenItem = this.getCachedTokens(requestScopes, acquireTokenAuthority.canonicalAuthority, account && account.homeAccountIdentifier);
        const expirationSec = Number(cachedTokenItem.value.expiresOnSec);
        const offsetCurrentTimeSec = TimeUtils.nowSeconds() + this.config.systemOptions.tokenRenewalOffsetSeconds;
        // Check if refresh is forced, or if tokens are expired. If neither are true, return a token response with the found token entry.
        if (!forceRefresh && expirationSec && expirationSec > offsetCurrentTimeSec) {
            const cachedScopes = ScopeSet.fromString(cachedTokenItem.key.scopes, this.config.authOptions.clientId, true);
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

            // Only populate id token if it exists in cache item.
            return StringUtils.isEmpty(cachedTokenItem.value.idToken) ? defaultTokenResponse :
                SPAResponseHandler.setResponseIdToken(defaultTokenResponse, new IdToken(cachedTokenItem.value.idToken, this.cryptoUtils));
        } else {
            // Renew the tokens.
            request.authority = cachedTokenItem.key.authority;
            const { tokenEndpoint } = acquireTokenAuthority;
            const refreshTokenRequest: RefreshTokenRequest = {
                refreshToken: cachedTokenItem.value.refreshToken,
                scopes: request.scopes,
                authority: request.authority
            };
            return this.renewToken(refreshTokenRequest, tokenEndpoint);
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
        this.spaCacheManager.removeAllAccessTokens(this.config.authOptions.clientId, authorityUri, homeAccountIdentifier);
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
        const acquireTokenAuthority = (authorityUri) ? AuthorityFactory.createInstance(authorityUri, this.networkClient) : this.defaultAuthority;

        // This is temporary. Remove when ADFS is supported for browser
        if(acquireTokenAuthority.authorityType == AuthorityType.Adfs){
            throw ClientAuthError.createInvalidAuthorityTypeError(acquireTokenAuthority.canonicalAuthority);
        }

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
    public handleFragmentResponse(hashFragment: string, cachedState: string): string {
        // Handle responses.
        const responseHandler = new SPAResponseHandler(this.config.authOptions.clientId, this.cacheStorage, this.spaCacheManager, this.cryptoUtils, this.logger);
        // Deserialize hash fragment response parameters.
        const hashUrlString = new UrlString(hashFragment);
        const serverParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();
        // Get code response
        return responseHandler.handleServerCodeResponse(serverParams, cachedState);
    }

    // #endregion

    // #region Helpers

    /**
     * Gets all cached tokens based on the given criteria.
     * @param requestScopes
     * @param authorityUri
     * @param homeAccountIdentifier
     */
    private getCachedTokens(requestScopes: ScopeSet, authorityUri: string, homeAccountIdentifier: string): AccessTokenCacheItem {
        // Get all access tokens with matching authority, and home account ID
        const tokenCacheItems: Array<AccessTokenCacheItem> = this.spaCacheManager.getAllAccessTokens(this.config.authOptions.clientId, authorityUri || "", homeAccountIdentifier || "");
        if (tokenCacheItems.length === 0) {
            throw ClientAuthError.createNoTokensFoundError(requestScopes.printScopes());
        }

        // Filter cache items based on available scopes.
        const filteredCacheItems: Array<AccessTokenCacheItem> = tokenCacheItems.filter(cacheItem => {
            const cachedScopes = ScopeSet.fromString(cacheItem.key.scopes, this.config.authOptions.clientId, true);
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
    private async getTokenResponse(tokenEndpoint: string, parameterBuilder: RequestParameterBuilder, authorityString: string, userState: string, cachedNonce?: string): Promise<TokenResponse> {
        // Perform token request.
        const acquiredTokenResponse = await this.networkClient.sendPostRequestAsync<ServerAuthorizationTokenResponse>(
            tokenEndpoint,
            {
                body: parameterBuilder.createQueryString(),
                headers: this.createDefaultTokenRequestHeaders()
            }
        );

        // Create response handler
        const responseHandler = new SPAResponseHandler(this.config.authOptions.clientId, this.cacheStorage, this.spaCacheManager, this.cryptoUtils, this.logger);
        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateServerAuthorizationTokenResponse(acquiredTokenResponse.body);
        // Return token response with given parameters
        const tokenResponse = responseHandler.createTokenResponse(acquiredTokenResponse.body, userState, authorityString, this.getAccount(), cachedNonce);
        // Set current account to received response account, if any.
        this.account = tokenResponse.account;
        return tokenResponse;
    }

    /**
     * Creates refreshToken request and sends to given token endpoint.
     * @param refreshTokenRequest
     * @param tokenEndpoint
     * @param refreshToken
     */
    private async renewToken(refreshTokenRequest: RefreshTokenRequest, tokenEndpoint: string): Promise<TokenResponse> {
        // Initialize request parameters.
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addRedirectUri(this.getRedirectUri());

        const scopeSet = new ScopeSet(
            refreshTokenRequest.scopes || [],
            this.config.authOptions.clientId,
            true
        );
        parameterBuilder.addScopes(scopeSet);

        parameterBuilder.addRefreshToken(refreshTokenRequest.refreshToken);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        // User helper to retrieve token response.
        // Need to await function call before return to catch any thrown errors.
        // if errors are thrown asynchronously in return statement, they are caught by caller of this function instead.
        return await this.getTokenResponse(tokenEndpoint, parameterBuilder, refreshTokenRequest.authority, "");
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
        if (this.config.authOptions.redirectUri) {
            if (typeof this.config.authOptions.redirectUri === "function") {
                return this.config.authOptions.redirectUri();
            } else if (!StringUtils.isEmpty(this.config.authOptions.redirectUri)) {
                return this.config.authOptions.redirectUri;
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
        if (this.config.authOptions.postLogoutRedirectUri) {
            if (typeof this.config.authOptions.postLogoutRedirectUri === "function") {
                return this.config.authOptions.postLogoutRedirectUri();
            } else if (!StringUtils.isEmpty(this.config.authOptions.postLogoutRedirectUri)) {
                return this.config.authOptions.postLogoutRedirectUri;
            }
        }
        // This should never throw unless window.location.href is returning empty.
        throw ClientConfigurationError.createPostLogoutRedirectUriEmptyError();
    }

    /**
     * Returns the signed in account
     * (the account object is created at the time of successful login)
     * or null when no state is found
     * @returns {@link Account} - the account object stored in MSAL
     */
    getAccount(): Account {
        if (this.account) {
            return this.account;
        }

        // Get id token and client info from cache
        const rawIdToken = this.cacheStorage.getItem(PersistentCacheKeys.ID_TOKEN) as string;
        const rawClientInfo = this.cacheStorage.getItem(PersistentCacheKeys.CLIENT_INFO) as string;

        if(!StringUtils.isEmpty(rawIdToken) && !StringUtils.isEmpty(rawClientInfo)) {
            const idToken = new IdToken(rawIdToken, this.cryptoUtils);
            const clientInfo = buildClientInfo(rawClientInfo, this.cryptoUtils);

            this.account = Account.createAccount(idToken, clientInfo, this.cryptoUtils);
            return this.account;
        }

        // if login is not yet done, return null
        return null;
    }

    // #endregion
}
