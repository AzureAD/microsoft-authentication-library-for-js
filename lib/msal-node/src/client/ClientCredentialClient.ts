/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccessTokenEntity,
    AuthenticationResult,
    Authority,
    CacheManager,
    ClientAuthErrorCodes,
    ClientConfiguration,
    Constants,
    CredentialFilter,
    IAppTokenProvider,
    ICrypto,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ScopeSet,
    ServerAuthorizationTokenResponse,
    ServerTelemetryManager,
    StringUtils,
    TimeUtils,
    TokenCacheContext,
    UrlString,
    createClientAuthError,
    ClientAssertion,
    getClientAssertion,
    UrlUtils,
    StubPerformanceClient,
    TokenProtocol,
    Logger,
    INetworkModule,
} from "@azure/msal-common/node";
import {
    ManagedIdentityConfiguration,
    ManagedIdentityNodeConfiguration,
} from "../config/Configuration.js";
import { CommonClientCredentialRequest } from "../request/CommonClientCredentialRequest.js";
import { NodeConfiguration } from "../config/Configuration.js";
import { NodeStorage } from "../cache/NodeStorage.js";
import { TokenCache } from "../cache/TokenCache.js";
import { Constants as NodeConstants } from "../utils/Constants.js";
import { version } from "../packageMetadata.js";

/**
 * OAuth2.0 client credential grant
 * @public
 */
export class ClientCredentialClient {
    private readonly appTokenProvider?: IAppTokenProvider;

    // Logger object
    public logger: Logger;

    // Application config
    protected config: NodeConfiguration;

    protected clientAssertion: ClientAssertion;

    // Crypto Interface
    protected cryptoUtils: ICrypto;

    // Storage Interface
    protected cacheManager: CacheManager;

    // Network Interface
    protected networkClient: INetworkModule;

    // Default authority object
    public authority: Authority;

    protected serverTelemetryManager: ServerTelemetryManager;

    constructor(configuration: NodeConfiguration, clientAssertion: ClientAssertion, logger: Logger, crypto: ICrypto, cacheManager: NodeStorage, discoveredAuthority: Authority, serverTelemetryManager: ServerTelemetryManager,
        appTokenProvider?: IAppTokenProvider) {
        // Set the configuration
        this.config = configuration;

        this.clientAssertion = clientAssertion;

        // Initialize the logger
        this.logger = logger;

        // Initialize crypto
        this.cryptoUtils = crypto;

        // Initialize storage interface
        this.cacheManager = cacheManager;

        // Set the network interface
        this.networkClient = this.config.system.networkClient;

        // set Authority
        this.authority = discoveredAuthority;

        this.serverTelemetryManager = serverTelemetryManager;
        this.appTokenProvider = appTokenProvider;
    }

    /**
     * Public API to acquire a token with ClientCredential Flow for Confidential clients
     * @param request - CommonClientCredentialRequest provided by the developer
     */
    public async acquireToken(
        request: CommonClientCredentialRequest,
        serializableCache: TokenCache
    ): Promise<AuthenticationResult | null> {
        if (request.skipCache || request.claims) {
            return this.executeTokenRequest(request, serializableCache);
        }

        const [cachedAuthenticationResult, lastCacheOutcome] =
            await ClientCredentialClient.getCachedAuthenticationResult(
                request,
                this.config,
                this.cryptoUtils,
                this.authority,
                this.cacheManager,
                this.serverTelemetryManager
            );

        if (cachedAuthenticationResult) {
            // if the token is not expired but must be refreshed; get a new one in the background
            if (
                lastCacheOutcome ===
                Constants.CacheOutcome.PROACTIVELY_REFRESHED
            ) {
                this.logger.info(
                    "ClientCredentialClient:getCachedAuthenticationResult - Cached access token's refreshOn property has been exceeded'. It's not expired, but must be refreshed.",
                    request.correlationId
                );

                // refresh the access token in the background
                const refreshAccessToken = true;
                await this.executeTokenRequest(
                    request,
                    serializableCache,
                    refreshAccessToken
                );
            }

            // return the cached token
            return cachedAuthenticationResult;
        } else {
            return this.executeTokenRequest(request, serializableCache);
        }
    }

    /**
     * looks up cache if the tokens are cached already
     */
    static async getCachedAuthenticationResult(
        request: CommonClientCredentialRequest,
        config: ClientConfiguration | ManagedIdentityConfiguration,
        cryptoUtils: ICrypto,
        authority: Authority,
        cacheManager: CacheManager,
        serverTelemetryManager?: ServerTelemetryManager | null
    ): Promise<[AuthenticationResult | null, Constants.CacheOutcome]> {
        const clientConfiguration = config as ClientConfiguration;
        const managedIdentityConfiguration =
            config as ManagedIdentityNodeConfiguration;

        let lastCacheOutcome: Constants.CacheOutcome =
            Constants.CacheOutcome.NOT_APPLICABLE;

        // read the user-supplied cache into memory, if applicable
        let cacheContext;
        if (
            clientConfiguration.serializableCache &&
            clientConfiguration.persistencePlugin
        ) {
            cacheContext = new TokenCacheContext(
                clientConfiguration.serializableCache,
                false
            );
            await clientConfiguration.persistencePlugin.beforeCacheAccess(
                cacheContext
            );
        }

        const cachedAccessToken = ClientCredentialClient.readAccessTokenFromCache(
            authority,
            managedIdentityConfiguration.managedIdentityId?.id ||
                clientConfiguration.authOptions.clientId,
            new ScopeSet(request.scopes || []),
            cacheManager,
            request.correlationId
        );

        if (
            clientConfiguration.serializableCache &&
            clientConfiguration.persistencePlugin &&
            cacheContext
        ) {
            await clientConfiguration.persistencePlugin.afterCacheAccess(
                cacheContext
            );
        }

        // must refresh due to non-existent access_token
        if (!cachedAccessToken) {
            serverTelemetryManager?.setCacheOutcome(
                Constants.CacheOutcome.NO_CACHED_ACCESS_TOKEN
            );
            return [null, Constants.CacheOutcome.NO_CACHED_ACCESS_TOKEN];
        }

        // must refresh due to the expires_in value
        if (
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                clientConfiguration.systemOptions?.tokenRenewalOffsetSeconds ||
                    Constants.DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
            )
        ) {
            serverTelemetryManager?.setCacheOutcome(
                Constants.CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED
            );
            return [null, Constants.CacheOutcome.CACHED_ACCESS_TOKEN_EXPIRED];
        }

        // must refresh (in the background) due to the refresh_in value
        if (
            cachedAccessToken.refreshOn &&
            TimeUtils.isTokenExpired(cachedAccessToken.refreshOn.toString(), 0)
        ) {
            lastCacheOutcome = Constants.CacheOutcome.PROACTIVELY_REFRESHED;
            serverTelemetryManager?.setCacheOutcome(
                Constants.CacheOutcome.PROACTIVELY_REFRESHED
            );
        }

        return [
            await ResponseHandler.generateAuthenticationResult(
                cryptoUtils,
                authority,
                {
                    account: null,
                    idToken: null,
                    accessToken: cachedAccessToken,
                    refreshToken: null,
                    appMetadata: null,
                },
                true,
                request,
                new StubPerformanceClient()
            ),
            lastCacheOutcome,
        ];
    }

    /**
     * Reads access token from the cache
     */
    static readAccessTokenFromCache(
        authority: Authority,
        id: string,
        scopeSet: ScopeSet,
        cacheManager: CacheManager,
        correlationId: string
    ): AccessTokenEntity | null {
        const accessTokenFilter: CredentialFilter = {
            homeAccountId: "",
            environment:
                authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: Constants.CredentialType.ACCESS_TOKEN,
            clientId: id,
            realm: authority.tenant,
            target: ScopeSet.createSearchScopes(scopeSet.asArray()),
        };

        const accessTokens = cacheManager.getAccessTokensByFilter(
            accessTokenFilter,
            correlationId
        );
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
     * @param request - CommonClientCredentialRequest provided by the developer
     * @param authority - authority object
     */
    private async executeTokenRequest(
        request: CommonClientCredentialRequest,
        serializableCache: TokenCache,
        refreshAccessToken?: boolean
    ): Promise<AuthenticationResult | null> {
        let serverTokenResponse: ServerAuthorizationTokenResponse;
        let reqTimestamp: number;
        const performanceClient = new StubPerformanceClient();

        if (this.appTokenProvider) {
            this.logger.info(
                "Using appTokenProvider extensibility.",
                request.correlationId
            );

            const appTokenPropviderParameters = {
                correlationId: request.correlationId,
                tenantId: this.authority.tenant,
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
                token_type: Constants.AuthenticationScheme.BEARER,
            };
        } else {
            const queryParametersString =
                TokenProtocol.createTokenQueryParameters(request, this.config.auth.clientId, "", performanceClient);
            const endpoint = UrlString.appendQueryString(
                this.authority.tokenEndpoint,
                queryParametersString
            );

            const requestBody = await this.createTokenRequestBody(request);
            const headers: Record<string, string> =
                TokenProtocol.createTokenRequestHeaders(this.logger, false);
            const thumbprint: RequestThumbprint = {
                clientId: this.config.auth.clientId,
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
                "Sending token request to endpoint: " + this.authority.tokenEndpoint,
                request.correlationId
            );

            reqTimestamp = TimeUtils.nowSeconds();
            const response = await TokenProtocol.executePostToTokenEndpoint(
                endpoint,
                requestBody,
                headers,
                thumbprint,
                request.correlationId,
                this.cacheManager,
                this.networkClient,
                this.logger,
                performanceClient,
                this.serverTelemetryManager
            );

            serverTokenResponse = response.body;
            serverTokenResponse.status = response.status;
        }

        const responseHandler = new ResponseHandler(
            this.config.auth.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            performanceClient,
            serializableCache,
            this.config.cache.cachePlugin || null
        );

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            request.correlationId,
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
     * @param request - CommonClientCredentialRequest provided by the developer
     */
    private async createTokenRequestBody(
        request: CommonClientCredentialRequest
    ): Promise<string> {
        const parameters = new Map<string, string>();

        RequestParameterBuilder.addClientId(
            parameters,
            this.config.auth.clientId
        );

        RequestParameterBuilder.addScopes(parameters, request.scopes, false);

        RequestParameterBuilder.addGrantType(
            parameters,
            Constants.GrantType.CLIENT_CREDENTIALS_GRANT
        );

        RequestParameterBuilder.addLibraryInfo(
            parameters,
            {
                sku: NodeConstants.MSAL_SKU,
                version: version,
                cpu: process.arch || "",
                os: process.platform || "",
            }
        );
        RequestParameterBuilder.addApplicationTelemetry(
            parameters,
            this.config.telemetry.application
        );

        RequestParameterBuilder.addThrottling(parameters);

        if (this.serverTelemetryManager) {
            RequestParameterBuilder.addServerTelemetry(
                parameters,
                this.serverTelemetryManager
            );
        }

        const correlationId =
            request.correlationId ||
            this.cryptoUtils.createNewGuid();
        RequestParameterBuilder.addCorrelationId(parameters, correlationId);

        if (this.config.auth.clientSecret) {
            RequestParameterBuilder.addClientSecret(
                parameters,
                this.config.auth.clientSecret
            );
        }

        // Use clientAssertion from request, fallback to client assertion in base configuration
        const clientAssertion: ClientAssertion | undefined =
            request.clientAssertion ||
            this.clientAssertion;

        if (clientAssertion) {
            RequestParameterBuilder.addClientAssertion(
                parameters,
                await getClientAssertion(
                    clientAssertion.assertion,
                    this.config.auth.clientId,
                    request.resourceRequestUri
                )
            );
            RequestParameterBuilder.addClientAssertionType(
                parameters,
                clientAssertion.assertionType
            );
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.config.auth.clientCapabilities &&
                this.config.auth.clientCapabilities.length > 0)
        ) {
            RequestParameterBuilder.addClaims(
                parameters,
                request.claims,
                this.config.auth.clientCapabilities
            );
        }

        return UrlUtils.mapToQueryString(parameters);
    }
}
