/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
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
    MtlsBindingCertificate,
    MtlsCertificate,
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
} from "@azure/msal-common/node";
import { ApiId } from "../utils/Constants.js";
import {
    ManagedIdentityConfiguration,
    ManagedIdentityNodeConfiguration,
} from "../config/Configuration.js";
import { CommonClientCredentialRequest } from "../request/CommonClientCredentialRequest.js";
import { BaseClient } from "./BaseClient.js";
import { NodeAuthError } from "../error/NodeAuthError.js";
import { HttpClient } from "../network/HttpClient.js";
import { computeX5tSha256, x5cToPem } from "../utils/MtlsCertificateUtils.js";

/**
 * OAuth2.0 client credential grant
 * @public
 */
export class ClientCredentialClient extends BaseClient {
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
     * @param request - CommonClientCredentialRequest provided by the developer
     */
    public async acquireToken(
        request: CommonClientCredentialRequest
    ): Promise<AuthenticationResult | null> {
        // Build additional cache key components for FMI cache isolation
        let additionalCacheKeyComponents: Record<string, string> | undefined;
        if (request.fmiPath) {
            additionalCacheKeyComponents = {
                fmi_path: request.fmiPath,
            };
        }

        /*
         * Isolate mTLS PoP tokens in the cache by the binding certificate they are bound to, so
         * tokens bound to different certificates (or Bearer tokens) never collide.
         */
        if (
            request.authenticationScheme ===
            Constants.AuthenticationScheme.MTLS_POP
        ) {
            /*
             * Fail fast on mTLS PoP misconfiguration (unsupported custom network client, or a
             * missing binding certificate / private key) before consulting the cache, so a cached
             * token is never returned for a request that could not be satisfied over mTLS.
             */
            const bindingCertificate = this.validateMtlsPopRequest(
                request.correlationId
            );
            additionalCacheKeyComponents = {
                ...(additionalCacheKeyComponents ?? {}),
                mtls_pop_cert_thumbprint: computeX5tSha256(
                    bindingCertificate.x5c
                ),
            };
        }

        if (request.skipCache || request.claims) {
            return this.executeTokenRequest(
                request,
                this.authority,
                /* refreshAccessToken */ undefined,
                additionalCacheKeyComponents
            );
        }

        const [cachedAuthenticationResult, lastCacheOutcome] =
            await this.getCachedAuthenticationResult(
                request,
                this.config,
                this.cryptoUtils,
                this.authority,
                this.cacheManager,
                this.serverTelemetryManager,
                additionalCacheKeyComponents
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
                    this.authority,
                    refreshAccessToken,
                    additionalCacheKeyComponents
                );
            }

            // return the cached token
            return cachedAuthenticationResult;
        } else {
            return this.executeTokenRequest(
                request,
                this.authority,
                /* refreshAccessToken */ undefined,
                additionalCacheKeyComponents
            );
        }
    }

    /**
     * looks up cache if the tokens are cached already
     */
    public async getCachedAuthenticationResult(
        request: CommonClientCredentialRequest,
        config: ClientConfiguration | ManagedIdentityConfiguration,
        cryptoUtils: ICrypto,
        authority: Authority,
        cacheManager: CacheManager,
        serverTelemetryManager?: ServerTelemetryManager | null,
        additionalCacheKeyComponents?: Record<string, string>
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

        const cachedAccessToken = this.readAccessTokenFromCache(
            authority,
            managedIdentityConfiguration.managedIdentityId?.id ||
                clientConfiguration.authOptions.clientId,
            new ScopeSet(request.scopes || [], request.correlationId),
            cacheManager,
            request.correlationId,
            request.authenticationScheme,
            additionalCacheKeyComponents
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

        const cachedResult = await ResponseHandler.generateAuthenticationResult(
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
            this.performanceClient
        );

        // Surface the binding certificate on cached mTLS PoP results as well.
        if (
            request.authenticationScheme ===
            Constants.AuthenticationScheme.MTLS_POP
        ) {
            this.setBindingCertificateOnResult(cachedResult);
        }

        return [cachedResult, lastCacheOutcome];
    }

    /**
     * Reads access token from the cache
     */
    private readAccessTokenFromCache(
        authority: Authority,
        id: string,
        scopeSet: ScopeSet,
        cacheManager: CacheManager,
        correlationId: string,
        authenticationScheme?: Constants.AuthenticationScheme,
        additionalCacheKeyComponents?: Record<string, string>
    ): AccessTokenEntity | null {
        /*
         * Distinguish Bearer from auth-scheme-bound (PoP / mTLS PoP) tokens. Auth-scheme tokens are
         * persisted under credentialType ACCESS_TOKEN_WITH_AUTH_SCHEME and must be looked up with the
         * matching tokenType, otherwise a cached mTLS PoP token would never be found.
         */
        const authScheme =
            authenticationScheme || Constants.AuthenticationScheme.BEARER;
        const isAuthSchemeToken =
            authScheme.toLowerCase() !==
            Constants.AuthenticationScheme.BEARER.toLowerCase();

        const accessTokenFilter: CredentialFilter = {
            homeAccountId: "",
            environment:
                authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: isAuthSchemeToken
                ? Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
                : Constants.CredentialType.ACCESS_TOKEN,
            clientId: id,
            realm: authority.tenant,
            target: ScopeSet.createSearchScopes(
                scopeSet.asArray(),
                correlationId
            ),
            tokenType: isAuthSchemeToken ? authScheme : undefined,
            additionalCacheKeyComponents: additionalCacheKeyComponents,
        };

        const accessTokens = cacheManager.getAccessTokensByFilter(
            accessTokenFilter,
            correlationId
        );
        if (accessTokens.length < 1) {
            return null;
        } else if (accessTokens.length > 1) {
            throw createClientAuthError(
                ClientAuthErrorCodes.multipleMatchingTokens,
                correlationId
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
        authority: Authority,
        refreshAccessToken?: boolean,
        additionalCacheKeyComponents?: Record<string, string>
    ): Promise<AuthenticationResult | null> {
        let serverTokenResponse: ServerAuthorizationTokenResponse;
        let reqTimestamp: number;

        if (this.appTokenProvider) {
            this.logger.info(
                "Using appTokenProvider extensibility.",
                request.correlationId
            );

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
                token_type: Constants.AuthenticationScheme.BEARER,
            };
        } else {
            const queryParametersString =
                this.createTokenQueryParameters(request);

            /*
             * mTLS Proof-of-Possession: target the mTLS token endpoint and present the binding
             * certificate as the client TLS certificate. The certificate authenticates the client
             * at the TLS layer, so ESTS returns a token bound to it (cnf/x5t#S256).
             */
            const isMtlsPop =
                request.authenticationScheme ===
                Constants.AuthenticationScheme.MTLS_POP;
            let mtlsCertificate: MtlsCertificate | undefined;
            let tokenEndpoint = authority.tokenEndpoint;

            if (isMtlsPop) {
                const bindingCertificate = this.validateMtlsPopRequest(
                    request.correlationId
                );
                tokenEndpoint = authority.getMtlsTokenEndpoint();
                mtlsCertificate = {
                    cert: x5cToPem(bindingCertificate.x5c),
                    key: bindingCertificate.privateKey,
                };
            }

            const endpoint = UrlString.appendQueryString(
                tokenEndpoint,
                queryParametersString
            );

            const requestBody = await this.createTokenRequestBody(request);
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
                "Sending token request to endpoint: " + tokenEndpoint,
                request.correlationId
            );

            reqTimestamp = TimeUtils.nowSeconds();
            const response = await this.executePostToTokenEndpoint(
                endpoint,
                requestBody,
                headers,
                thumbprint,
                request.correlationId,
                mtlsCertificate
            );

            serverTokenResponse = response.body;
            serverTokenResponse.status = response.status;
        }

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.performanceClient,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        responseHandler.validateTokenResponse(
            serverTokenResponse,
            request.correlationId,
            refreshAccessToken
        );

        /*
         * mTLS PoP must fail closed. If the identity provider returns a token_type other than
         * mtls_pop (a Bearer downgrade, or a missing token_type), the issued token is not
         * certificate-bound. Reject here — before handleServerTokenResponse caches the response or it
         * is surfaced — so a caller never receives a token that only looks bound. The appTokenProvider
         * path supplies its own (Bearer) token and is intentionally exempt.
         */
        if (
            this.appTokenProvider === undefined &&
            request.authenticationScheme ===
                Constants.AuthenticationScheme.MTLS_POP &&
            serverTokenResponse.token_type?.toLowerCase() !==
                Constants.AuthenticationScheme.MTLS_POP.toLowerCase()
        ) {
            this.logger.error(
                "ClientCredentialClient:executeTokenRequest - mTLS PoP token_type mismatch; the identity provider did not return an mtls_pop token. Failing closed.",
                request.correlationId
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenTypeMismatch,
                request.correlationId,
                `Requested authentication scheme "${
                    Constants.AuthenticationScheme.MTLS_POP
                }" but the identity provider returned token_type "${
                    serverTokenResponse.token_type ?? ""
                }"; the access token is not certificate-bound.`
            );
        }

        const tokenResponse = await responseHandler.handleServerTokenResponse(
            serverTokenResponse,
            this.authority,
            reqTimestamp,
            request,
            ApiId.acquireTokenByClientCredential,
            undefined, // authCodePayload
            undefined, // userAssertionHash
            undefined, // handlingRefreshTokenResponse
            undefined, // forceCacheRefreshTokenResponse
            undefined, // serverRequestId
            additionalCacheKeyComponents
        );

        // Surface the binding certificate (public material only) on mTLS PoP results.
        if (
            tokenResponse &&
            request.authenticationScheme ===
                Constants.AuthenticationScheme.MTLS_POP
        ) {
            this.setBindingCertificateOnResult(tokenResponse);
        }

        return tokenResponse;
    }

    /**
     * Validates that an mTLS Proof-of-Possession request can be satisfied before any cache lookup
     * or network call: MSAL must own the transport (the built-in HttpClient, since a custom
     * networkClient cannot present a client certificate), and a binding certificate with a private
     * key must be resolvable. Returns the resolved binding certificate so callers can reuse it
     * (e.g. for cache-key isolation and the TLS handshake).
     */
    private validateMtlsPopRequest(
        correlationId: string
    ): MtlsBindingCertificate {
        if (!(this.networkClient instanceof HttpClient)) {
            throw NodeAuthError.createMtlsCustomNetworkClientUnsupportedError(
                correlationId
            );
        }
        const bindingCertificate =
            this.config.clientCredentials.mtlsBindingCertificate;
        if (!bindingCertificate) {
            throw NodeAuthError.createMtlsBindingCertificateMissingError(
                correlationId
            );
        }
        if (!bindingCertificate.privateKey) {
            throw NodeAuthError.createMtlsBindingCertificateMissingPrivateKeyError(
                correlationId
            );
        }
        return bindingCertificate;
    }

    /**
     * Populates `bindingCertificate` (public certificate + SHA-256 thumbprint) on an mTLS PoP
     * result. The private key is never surfaced — the developer already possesses it.
     * @param result - AuthenticationResult to augment
     */
    private setBindingCertificateOnResult(result: AuthenticationResult): void {
        /*
         * Drive the binding certificate off the issued token_type (not the request flag): only a
         * genuine mtls_pop token is certificate-bound. This prevents surfacing a bindingCertificate on
         * a downgraded/Bearer token (e.g. from the appTokenProvider path, which is exempt from the
         * token_type fail-closed guard in executeTokenRequest).
         */
        if (
            result.tokenType?.toLowerCase() !==
            Constants.AuthenticationScheme.MTLS_POP.toLowerCase()
        ) {
            return;
        }
        const bindingCertificate =
            this.config.clientCredentials.mtlsBindingCertificate;
        if (bindingCertificate) {
            result.bindingCertificate = {
                x5c: bindingCertificate.x5c,
                thumbprintSha256: computeX5tSha256(bindingCertificate.x5c),
            };
        }
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
            this.config.authOptions.clientId
        );

        RequestParameterBuilder.addScopes(
            parameters,
            request.scopes,
            request.correlationId,
            false
        );

        RequestParameterBuilder.addGrantType(
            parameters,
            Constants.GrantType.CLIENT_CREDENTIALS_GRANT
        );

        RequestParameterBuilder.addLibraryInfo(
            parameters,
            this.config.libraryInfo
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
            this.config.cryptoInterface.createNewGuid();
        RequestParameterBuilder.addCorrelationId(parameters, correlationId);

        const isMtlsPop =
            request.authenticationScheme ===
            Constants.AuthenticationScheme.MTLS_POP;

        /*
         * In SNI mTLS PoP the configured certificate authenticates the client at the TLS layer, so
         * no client_secret / client_assertion is sent in the body.
         */
        const useCertAsCredential =
            isMtlsPop && !!this.config.clientCredentials.mtlsBindingCertificate;

        if (isMtlsPop) {
            RequestParameterBuilder.addMtlsPopToken(parameters);
        }

        if (!useCertAsCredential) {
            if (this.config.clientCredentials.clientSecret) {
                RequestParameterBuilder.addClientSecret(
                    parameters,
                    this.config.clientCredentials.clientSecret
                );
            }

            // Use clientAssertion from request, fallback to client assertion in base configuration
            const clientAssertion: ClientAssertion | undefined =
                request.clientAssertion ||
                this.config.clientCredentials.clientAssertion;

            if (clientAssertion) {
                RequestParameterBuilder.addClientAssertion(
                    parameters,
                    await getClientAssertion(
                        clientAssertion.assertion,
                        this.config.authOptions.clientId,
                        this.authority.tokenEndpoint,
                        request.fmiPath
                    )
                );
                RequestParameterBuilder.addClientAssertionType(
                    parameters,
                    clientAssertion.assertionType
                );
            }
        }

        if (request.fmiPath) {
            parameters.set(AADServerParamKeys.FMI_PATH, request.fmiPath);
        }

        if (
            !StringUtils.isEmptyObj(request.claims) ||
            (this.config.authOptions.clientCapabilities &&
                this.config.authOptions.clientCapabilities.length > 0)
        ) {
            RequestParameterBuilder.addClaims(
                parameters,
                request.correlationId,
                request.claims,
                this.config.authOptions.clientCapabilities
            );
        }

        return UrlUtils.mapToQueryString(parameters);
    }
}
