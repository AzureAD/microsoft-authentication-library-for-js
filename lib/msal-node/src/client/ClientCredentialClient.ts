/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AuthenticationResult,
    AuthenticationScheme,
    Authority,
    BaseClient,
    CacheOutcome,
    ClientAuthErrorCodes,
    ClientConfiguration,
    CommonClientCredentialRequest,
    Constants,
    CredentialFilter,
    CredentialType,
    GrantType,
    IAppTokenProvider,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ScopeSet,
    ServerAuthorizationTokenResponse,
    StringUtils,
    TimeUtils,
    TokenCacheContext,
    UrlString,
    createClientAuthError,
} from "@azure/msal-common";

/**
 * OAuth2.0 client credential grant
 */
export class ClientCredentialClient extends BaseClient {
    private scopeSet: ScopeSet;
    private readonly appTokenProvider?: IAppTokenProvider;

    constructor(
        configuration: ClientConfiguration,
        appTokenProvider?: IAppTokenProvider
    ) {
        super(configuration);
        this.appTokenProvider = appTokenProvider;
    }

    /**
     * Public API to acquire a token with ClientCredential Flow for Confidential clients
     * @param request
     */
    public async acquireToken(
        request: CommonClientCredentialRequest
    ): Promise<AuthenticationResult | null> {
        this.scopeSet = new ScopeSet(request.scopes || []);

        if (request.skipCache) {
            return this.executeTokenRequest(request, this.authority);
        }

        const [cachedAuthenticationResult, lastCacheOutcome] =
            await this.getCachedAuthenticationResult(request);

        if (cachedAuthenticationResult) {
            // if the token is not expired but must be refreshed; get a new one in the background
            if (lastCacheOutcome === CacheOutcome.PROACTIVELY_REFRESHED) {
                this.logger.info(
                    "ClientCredentialClient:getCachedAuthenticationResult - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed."
                );

                // refresh the access token in the background
                const refreshAccessToken = true;
                await this.executeTokenRequest(
                    request,
                    this.authority,
                    refreshAccessToken
                );
            }

            // return the cached token
            return cachedAuthenticationResult;
        } else {
            return this.executeTokenRequest(request, this.authority);
        }
    }

    /**
     * looks up cache if the tokens are cached already
     */
    private async getCachedAuthenticationResult(
        request: CommonClientCredentialRequest
    ): Promise<[AuthenticationResult | null, CacheOutcome]> {
        let lastCacheOutcome: CacheOutcome = CacheOutcome.NOT_APPLICABLE;

        // read the user-supplied cache into memory, if applicable
        let cacheContext;
        if (this.config.serializableCache && this.config.persistencePlugin) {
            cacheContext = new TokenCacheContext(
                this.config.serializableCache,
                false
            );
            await this.config.persistencePlugin.beforeCacheAccess(cacheContext);
        }

        const cachedAccessToken = this.readAccessTokenFromCache();

        if (
            this.config.serializableCache &&
            this.config.persistencePlugin &&
            cacheContext
        ) {
            await this.config.persistencePlugin.afterCacheAccess(cacheContext);
        }

        // must refresh due to non-existent access_token
        if (!cachedAccessToken) {
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.NO_CACHED_ACCESS_TOKEN
            );
            return [null, CacheOutcome.NO_CACHED_ACCESS_TOKEN];
        }

        // must refresh due to the expires_in value
        if (
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                this.config.systemOptions.tokenRenewalOffsetSeconds
            )
        ) {
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED
            );
            return [null, CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED];
        }

        // must refresh (in the background) due to the refresh_in value
        if (
            cachedAccessToken.refreshOn &&
            TimeUtils.isTokenExpired(cachedAccessToken.refreshOn.toString(), 0)
        ) {
            lastCacheOutcome = CacheOutcome.PROACTIVELY_REFRESHED;
            this.serverTelemetryManager?.setCacheOutcome(
                CacheOutcome.PROACTIVELY_REFRESHED
            );
        }

        return [
            await ResponseHandler.generateAuthenticationResult(
                this.cryptoUtils,
                this.authority,
                {
                    account: null,
                    idToken: null,
                    accessToken: cachedAccessToken,
                    refreshToken: null,
                    appMetadata: null,
                },
                true,
                request
            ),
            lastCacheOutcome,
        ];
    }

    /**
     * Reads access token from the cache
     */
    private readAccessTokenFromCache(): AccessTokenEntity | null {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId: Constants.EMPTY_STRING,
            environment:
                this.authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: CredentialType.ACCESS_TOKEN,
            clientId: this.config.authOptions.clientId,
            realm: this.authority.tenant,
            target: ScopeSet.createSearchScopes(this.scopeSet.asArray()),
        };

        const accessTokens =
            this.cacheManager.getAccessTokensByFilter(accessTokenFilter);
        if (accessTokens.length < 1) {
            return null;
        } else if (accessTokens.length > 1) {
            throw createClientAuthError(
                ClientAuthErrorCodes.multipleMatchingTokens
            );
        }
        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Makes a network call to request the token from the service
     * @param request
     * @param authority
     */
    private async executeTokenRequest(
        request: CommonClientCredentialRequest,
        authority: Authority,
        refreshAccessToken?: boolean
    ): Promise<AuthenticationResult | null> {
        let serverTokenResponse: ServerAuthorizationTokenResponse;
        let reqTimestamp: number;

        if (this.appTokenProvider) {
            this.logger.info("Using appTokenProvider extensibility.");

            const appTokenPropviderParameters = {
                correlationId: request.correlationId,
                tenantId: this.config.authOptions.authority.tenant,
                scopes: request.scopes,
                claims: request.claims,
            };

            reqTimestamp = TimeUtils.nowSeconds();
            const appTokenProviderResult = await this.appTokenProvider(
                appTokenPropviderParameters
            );

            serverTokenResponse = {
                access_token: appTokenProviderResult.accessToken,
                expires_in: appTokenProviderResult.expiresInSeconds,
                refresh_in: appTokenProviderResult.refreshInSeconds,
                token_type: AuthenticationScheme.BEARER,
            };
        } else {
            const queryParametersString =
                this.createTokenQueryParameters(request);
            const endpoint = UrlString.appendQueryString(
                authority.tokenEndpoint,
                queryParametersString
            );

            const requestBody = this.createTokenRequestBody(request);
            const headers: Record<string, string> =
                this.createTokenRequestHeaders();
            const thumbprint: RequestThumbprint = {
                clientId: this.config.authOptions.clientId,
                authority: request.authority,
                scopes: request.scopes,
                claims: request.claims,
                authenticationScheme: request.authenticationScheme,
                resourceRequestMethod: request.resourceRequestMethod,
                resourceRequestUri: request.resourceRequestUri,
                shrClaims: request.shrClaims,
                sshKid: request.sshKid,
            };

            this.logger.info(
                "Sending token request to endpoint: " + authority.tokenEndpoint
            );

            reqTimestamp = TimeUtils.nowSeconds();
            const response = await this.executePostToTokenEndpoint(
                endpoint,
                requestBody,
                headers,
                thumbprint,
                request.correlationId
            );

            serverTokenResponse = response.body;
            serverTokenResponse.status = response.status;
        }

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            refreshAccessToken
        );

        const tokenResponse = await responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            this.authority,
            reqTimestamp,
            request
        );

        return tokenResponse;
    }

    /**
     * generate the request to the server in the acceptable format
     * @param request
     */
    private createTokenRequestBody(
        request: CommonClientCredentialRequest
    ): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        parameterBuilder.addScopes(request.scopes, false);

        parameterBuilder.addGrantType(GrantType.CLIENT_CREDENTIALS_GRANT);

        parameterBuilder.addLibraryInfo(this.config.libraryInfo);
        parameterBuilder.addApplicationTelemetry(
            this.config.telemetry.application
        );

        parameterBuilder.addThrottling();

        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        const correlationId =
            request.correlationId ||
            this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(
                this.config.clientCredentials.clientSecret
            );
        }

        // Use clientAssertion from request, fallback to client assertion in base configuration
        const clientAssertion =
            request.clientAssertion ||
            this.config.clientCredentials.clientAssertion;

        if (clientAssertion) {
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(
                clientAssertion.assertionType
            );
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            parameterBuilder.addClaims(
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }

        return parameterBuilder.createQueryString();
    }
}
