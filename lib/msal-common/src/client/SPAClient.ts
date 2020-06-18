/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { BaseClient } from "./BaseClient";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ServerAuthorizationCodeResponse } from "../server/ServerAuthorizationCodeResponse";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { ClientAuthError } from "../error/ClientAuthError";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { AuthorityFactory } from "../authority/AuthorityFactory";
import { IdToken } from "../account/IdToken";
import { ScopeSet } from "../request/ScopeSet";
import { AADServerParamKeys, Constants, ResponseMode, GrantType, CredentialType } from "../utils/Constants";
import { TimeUtils } from "../utils/TimeUtils";
import { StringUtils } from "../utils/StringUtils";
import { UrlString } from "../url/UrlString";
import { B2cAuthority } from "../authority/B2cAuthority";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { RequestParameterBuilder } from "../server/RequestParameterBuilder";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { RefreshTokenRequest } from "../request/RefreshTokenRequest";
import { AuthorityType } from "../authority/AuthorityType";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { Authority } from "../authority/Authority";
import { SilentFlowRequest } from "../request/SilentFlowRequest";
import { CacheHelper } from "../cache/utils/CacheHelper";
import { IdTokenEntity } from "../cache/entities/IdTokenEntity";
import { RefreshTokenEntity } from "../cache/entities/RefreshTokenEntity";
import { AccessTokenEntity } from "../cache/entities/AccessTokenEntity";
import { IAccount } from "../account/IAccount";
import { CredentialFilter, CredentialCache } from "../cache/utils/CacheTypes";
import { AccountEntity } from "../cache/entities/AccountEntity";

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

        B2cAuthority.setKnownAuthorities(
            this.config.authOptions.knownAuthorities
        );
    }

    /**
     * Creates a url for logging in a user. Also performs validation of the request parameters.
     * Including any SSO parameters (account, sid, login_hint) will short circuit the authentication and allow you to retrieve a code without interaction.
     * @param request
     */
    async createUrl(request: AuthorizationUrlRequest): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority =
            request && request.authority
                ? AuthorityFactory.createInstance(
                    request.authority,
                    this.networkClient
                )
                : this.defaultAuthority;

        // This is temporary. Remove when ADFS is supported for browser
        if (acquireTokenAuthority.authorityType == AuthorityType.Adfs) {
            throw ClientAuthError.createInvalidAuthorityTypeError(
                acquireTokenAuthority.canonicalAuthority
            );
        }

        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }

        const queryString = await this.createUrlRequestParamString(
            request
        );
        return `${acquireTokenAuthority.authorizationEndpoint}?${queryString}`;
    }

    private async createUrlRequestParamString(request: AuthorizationUrlRequest): Promise<string> {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addResponseTypeCode();

        // Client ID
        parameterBuilder.addClientId(this.config.authOptions.clientId);
        const scopeSet = new ScopeSet((request && request.scopes) || []);

        if (request.extraScopesToConsent) {
            scopeSet.appendScopes(request && request.extraScopesToConsent);
        }

        parameterBuilder.addScopes(scopeSet);

        parameterBuilder.addRedirectUri(this.getRedirectUri());

        const correlationId =
            (request && request.correlationId) ||
            this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        parameterBuilder.addCodeChallengeParams(
            request.codeChallenge,
            request.codeChallengeMethod ||
                `${Constants.S256_CODE_CHALLENGE_METHOD}`
        );

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
    async acquireToken(codeRequest: AuthorizationCodeRequest, userState: string, cachedNonce: string): Promise<AuthenticationResult> {
        // If no code response is given, we cannot acquire a token.
        if (!codeRequest || StringUtils.isEmpty(codeRequest.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

        // Initialize authority or use default, and perform discovery endpoint check.
        const acquireTokenAuthority = codeRequest && codeRequest.authority ? AuthorityFactory.createInstance(codeRequest.authority, this.networkClient) : this.defaultAuthority;
        if (!acquireTokenAuthority.discoveryComplete()) {
            try {
                await acquireTokenAuthority.resolveEndpointsAsync();
            } catch (e) {
                throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
            }
        }

        const parameterBuilder = new RequestParameterBuilder();
        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addRedirectUri(
            codeRequest.redirectUri || this.getRedirectUri()
        );

        const scopeSet = new ScopeSet(codeRequest.scopes || []);
        parameterBuilder.addScopes(scopeSet);

        // add code: set by user, not validated
        parameterBuilder.addAuthorizationCode(codeRequest.code);

        parameterBuilder.addCodeVerifier(codeRequest.codeVerifier);

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
        parameterBuilder.addClientInfo();

        // Get token endpoint.
        const { tokenEndpoint } = acquireTokenAuthority;

        // User helper to retrieve token response.
        // Need to await function call before return to catch any thrown errors.
        // if errors are thrown asynchronously in return statement, they are caught by caller of this function instead.
        return await this.getTokenResponse(tokenEndpoint, parameterBuilder, acquireTokenAuthority, cachedNonce, userState);
    }

    /**
     * Retrieves a token from cache if it is still valid, or uses the cached refresh token to renew
     * the given token and returns the renewed token. Will throw an error if login is not completed (unless
     * id tokens are not being renewed).
     * @param request
     */
    async getValidToken(request: SilentFlowRequest): Promise<AuthenticationResult> {
        // Cannot renew token if no request object is given.
        if (!request) {
            throw ClientConfigurationError.createEmptyTokenRequestError();
        }

        if (!request.account) {
            throw ClientAuthError.createNoAccountInSilentRequestError();
        }

        // Get account object for this request.
        const requestScopes = new ScopeSet(request.scopes || []);

        // Get current cached tokens
        const cachedAccount = this.cacheManager.getAccount(CacheHelper.generateAccountCacheKey(request.account));

        const homeAccountId = cachedAccount.homeAccountId;
        const env = cachedAccount.environment;

        const cachedAccessToken = this.fetchAccessToken(homeAccountId, env, requestScopes, cachedAccount.realm);
        const cachedRefreshToken = this.fetchRefreshToken(homeAccountId, env);
        if (!cachedAccessToken) {
            throw ClientAuthError.createNoTokensFoundError();
        }

        // Check if refresh is forced, or if tokens are expired. If neither are true, return a token response with the found token entry.
        if (request.forceRefresh || this.isTokenExpired(cachedAccessToken.expiresOn)) {
            if (!cachedRefreshToken) {
                throw ClientAuthError.createNoTokensFoundError();
            }

            // Initialize authority or use default, and perform discovery endpoint check.
            const acquireTokenAuthority = request.authority ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthority;

            // This is temporary. Remove when ADFS is supported for browser
            if (acquireTokenAuthority.authorityType === AuthorityType.Adfs) {
                throw ClientAuthError.createInvalidAuthorityTypeError(acquireTokenAuthority.canonicalAuthority);
            }

            if (!acquireTokenAuthority.discoveryComplete()) {
                try {
                    await acquireTokenAuthority.resolveEndpointsAsync();
                } catch (e) {
                    throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
                }
            }

            // Renew the tokens.
            const { tokenEndpoint } = acquireTokenAuthority;
            const refreshTokenRequest: RefreshTokenRequest = {
                refreshToken: cachedRefreshToken.secret,
                scopes: request.scopes,
                authority: acquireTokenAuthority.canonicalAuthority
            };
            return this.renewToken(refreshTokenRequest, acquireTokenAuthority, tokenEndpoint);
        } else {
            const cachedIdToken = this.fetchIdToken(homeAccountId, env, cachedAccount.realm);
            const idTokenObj = new IdToken(cachedIdToken.secret, this.cryptoUtils);

            const cachedScopes = ScopeSet.fromString(cachedAccessToken.target);
            return {
                uniqueId: idTokenObj.claims.oid || idTokenObj.claims.sub,
                tenantId: idTokenObj.claims.tid,
                scopes: cachedScopes.asArray(),
                idToken: idTokenObj.rawIdToken,
                idTokenClaims: idTokenObj.claims,
                accessToken: cachedAccessToken.secret,
                fromCache: true,
                account: CacheHelper.toIAccount(cachedAccount),
                expiresOn: new Date(cachedAccessToken.expiresOn),
                extExpiresOn: new Date(cachedAccessToken.extendedExpiresOn),
                familyId: null,
                state: ""
            };
        }
    }

    // #region Logout

    /**
     * Use to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri
     */
    async logout(account: IAccount, acquireTokenAuthority: Authority): Promise<string> {
        // Clear current account.
        this.cacheManager.removeAccount(CacheHelper.generateAccountCacheKey(account));
        // Get postLogoutRedirectUri.
        let postLogoutRedirectUri = "";
        try {
            postLogoutRedirectUri = `?${AADServerParamKeys.POST_LOGOUT_URI}=` + encodeURIComponent(this.getPostLogoutRedirectUri());
        } catch (e) {}

        // Acquire token authorities.
        if (!acquireTokenAuthority) {
            acquireTokenAuthority = this.defaultAuthority;
        }

        // This is temporary. Remove when ADFS is supported for browser
        if (acquireTokenAuthority.authorityType === AuthorityType.Adfs) {
            throw ClientAuthError.createInvalidAuthorityTypeError(
                acquireTokenAuthority.canonicalAuthority
            );
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
        const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger);
        // Deserialize hash fragment response parameters.
        const hashUrlString = new UrlString(hashFragment);
        const serverParams = hashUrlString.getDeserializedHash<ServerAuthorizationCodeResponse>();

        // Get code response
        responseHandler.validateServerAuthorizationCodeResponse(serverParams, cachedState, this.cryptoUtils);
        return serverParams.code;
    }

    // #endregion

    // #region Helpers

    /**
     * fetches idToken from cache if present
     * @param request
     */
    private fetchIdToken(homeAccountId: string, environment: string, inputRealm: string): IdTokenEntity {
        const idTokenKey: string = CacheHelper.generateCredentialCacheKey(
            homeAccountId,
            environment,
            CredentialType.ID_TOKEN,
            this.config.authOptions.clientId,
            inputRealm
        );
        return this.cacheManager.getCredential(idTokenKey) as IdTokenEntity;
    }

    /**
     * fetches accessToken from cache if present
     * @param request
     * @param scopes
     */
    private fetchAccessToken(homeAccountId: string, environment: string, scopes: ScopeSet, inputRealm: string): AccessTokenEntity {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId,
            environment,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: inputRealm,
            target: scopes.printScopes()
        };
        const credentialCache: CredentialCache = this.cacheManager.getCredentialsFilteredBy(accessTokenFilter);
        const accessTokens = Object.values(credentialCache.accessTokens);
        if (accessTokens.length > 1) {
            // TODO: Figure out what to throw or return here.
        } else if (accessTokens.length < 1) {
            return null;
        }
        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * fetches refreshToken from cache if present
     * @param request
     */
    private fetchRefreshToken(homeAccountId: string, environment: string): RefreshTokenEntity {
        const refreshTokenKey: string = CacheHelper.generateCredentialCacheKey(
            homeAccountId,
            environment,
            CredentialType.REFRESH_TOKEN,
            this.config.authOptions.clientId
        );
        return this.cacheManager.getCredential(refreshTokenKey) as RefreshTokenEntity;
    }

    /**
     * check if an access token is expired
     * @param expiresOn
     */
    private isTokenExpired(expiresOn: string): boolean {
        // check for access token expiry
        const expirationSec = Number(expiresOn) || 0;
        const offsetCurrentTimeSec =
            TimeUtils.nowSeconds() +
            this.config.systemOptions.tokenRenewalOffsetSeconds;

        // If current time + offset is greater than token expiration time, then token is expired.
        return offsetCurrentTimeSec > expirationSec;
    }

    /**
     * Makes a request to the token endpoint with the given parameters and parses the response.
     * @param tokenEndpoint
     * @param tokenReqParams
     * @param tokenRequest
     * @param codeResponse
     */
    private async getTokenResponse(tokenEndpoint: string, parameterBuilder: RequestParameterBuilder, authority: Authority, cachedNonce?: string, userState?: string): Promise<AuthenticationResult> {
        // Perform token request.
        const acquiredTokenResponse = await this.networkClient.sendPostRequestAsync<
        ServerAuthorizationTokenResponse
        >(tokenEndpoint, {
            body: parameterBuilder.createQueryString(),
            headers: this.createDefaultTokenRequestHeaders(),
        });

        // Create response handler
        const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger);
        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(acquiredTokenResponse.body);
        // Return token response with given parameters
        const tokenResponse = responseHandler.generateAuthenticationResult(acquiredTokenResponse.body, authority, cachedNonce);
        tokenResponse.state = userState;

        return tokenResponse;
    }

    /**
     * Creates refreshToken request and sends to given token endpoint.
     * @param refreshTokenRequest
     * @param tokenEndpoint
     * @param refreshToken
     */
    private async renewToken(refreshTokenRequest: RefreshTokenRequest, authority: Authority, tokenEndpoint: string): Promise<AuthenticationResult> {
        // Initialize request parameters.
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addRedirectUri(this.getRedirectUri());

        const scopeSet = new ScopeSet(refreshTokenRequest.scopes || []);
        parameterBuilder.addScopes(scopeSet);

        parameterBuilder.addRefreshToken(refreshTokenRequest.refreshToken);

        parameterBuilder.addGrantType(GrantType.REFRESH_TOKEN_GRANT);

        parameterBuilder.addClientInfo();

        // User helper to retrieve token response.
        // Need to await function call before return to catch any thrown errors.
        // if errors are thrown asynchronously in return statement, they are caught by caller of this function instead.
        return await this.getTokenResponse(tokenEndpoint, parameterBuilder, authority);
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
            } else if (
                !StringUtils.isEmpty(this.config.authOptions.postLogoutRedirectUri)
            ) {
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
    getAccount(homeAccountIdentifier: string, env?: string, rlm?: string): AccountEntity {
        const accountCache = this.cacheManager.getAccountsFilteredBy({
            homeAccountId: homeAccountIdentifier,
            environment: env,
            realm: rlm
        });

        const numAccounts = Object.keys(accountCache).length;
        if (numAccounts < 1) {
            return null;
        } else if (numAccounts > 1) {
            throw ClientAuthError.createMultipleMatchingAccountsInCacheError();
        } else {
            return accountCache[0];
        }
    }

    // #endregion
}
