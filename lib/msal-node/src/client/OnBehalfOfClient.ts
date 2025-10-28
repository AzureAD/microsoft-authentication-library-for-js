/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    AccessTokenEntity,
    AccountEntity,
    AccountInfo,
    AuthenticationResult,
    Authority,
    AuthToken,
    ClientAuthErrorCodes,
    createClientAuthError,
    CredentialFilter,
    Constants,
    IdTokenEntity,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ScopeSet,
    TimeUtils,
    TokenClaims,
    UrlString,
    ClientAssertion,
    getClientAssertion,
    UrlUtils,
    StubPerformanceClient,
    TokenProtocol,
    Logger,
    ICrypto,
    CacheManager,
    INetworkModule,
} from "@azure/msal-common/node";
import { EncodingUtils } from "../utils/EncodingUtils.js";
import { CommonOnBehalfOfRequest } from "../request/CommonOnBehalfOfRequest.js";
import { NodeConfiguration } from "../config/Configuration.js";
import { NodeStorage } from "../cache/NodeStorage.js";
import { TokenCache } from "../cache/TokenCache.js";
import { Constants as NodeConstants } from "../utils/Constants.js";
import { version } from "../packageMetadata.js";

/**
 * On-Behalf-Of client
 * @public
 */
export class OnBehalfOfClient {
    private scopeSet: ScopeSet;
    private userAssertionHash: string;

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

    constructor(configuration: NodeConfiguration, clientAssertion: ClientAssertion, logger: Logger, crypto: ICrypto, cacheManager: NodeStorage, discoveredAuthority: Authority) {
        // Set the configuration
        this.config = configuration;

        // Initialize the logger
        this.logger = logger;

        this.clientAssertion = clientAssertion;

        // Initialize crypto
        this.cryptoUtils = crypto;

        // Initialize storage interface
        this.cacheManager = cacheManager;

        // Set the network interface
        this.networkClient = this.config.system.networkClient;

        // set Authority
        this.authority = discoveredAuthority;
    }

    /**
     * Public API to acquire tokens with on behalf of flow
     * @param request - developer provided CommonOnBehalfOfRequest
     */
    public async acquireToken(
        request: CommonOnBehalfOfRequest,
        serializableCache: TokenCache
    ): Promise<AuthenticationResult | null> {
        this.scopeSet = new ScopeSet(request.scopes || []);

        // generate the user_assertion_hash for OBOAssertion
        this.userAssertionHash = await this.cryptoUtils.hashString(
            request.oboAssertion
        );

        if (request.skipCache || request.claims) {
            return this.executeTokenRequest(
                request,
                this.authority,
                this.userAssertionHash,
                serializableCache
            );
        }

        try {
            return await this.getCachedAuthenticationResult(request);
        } catch (e) {
            // Any failure falls back to interactive request, once we implement distributed cache, we plan to handle `createRefreshRequiredError` to refresh using the RT
            return await this.executeTokenRequest(
                request,
                this.authority,
                this.userAssertionHash,
                serializableCache
            );
        }
    }

    /**
     * look up cache for tokens
     * Find idtoken in the cache
     * Find accessToken based on user assertion and account info in the cache
     * Please note we are not yet supported OBO tokens refreshed with long lived RT. User will have to send a new assertion if the current access token expires
     * This is to prevent security issues when the assertion changes over time, however, longlived RT helps retaining the session
     * @param request - developer provided CommonOnBehalfOfRequest
     */
    private async getCachedAuthenticationResult(
        request: CommonOnBehalfOfRequest
    ): Promise<AuthenticationResult | null> {
        // look in the cache for the access_token which matches the incoming_assertion
        const cachedAccessToken = this.readAccessTokenFromCacheForOBO(
            this.config.auth.clientId,
            request
        );
        if (!cachedAccessToken) {
            this.logger.info(
                "SilentFlowClient:acquireCachedToken - No access token found in cache for the given properties.",
                request.correlationId
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        } else if (
            TimeUtils.isTokenExpired(
                cachedAccessToken.expiresOn,
                Constants.DEFAULT_TOKEN_RENEWAL_OFFSET_SEC
            )
        ) {
            this.logger.info(
                `OnbehalfofFlow:getCachedAuthenticationResult - Cached access token is expired or will expire within ${Constants.DEFAULT_TOKEN_RENEWAL_OFFSET_SEC} seconds.`,
                request.correlationId
            );
            throw createClientAuthError(
                ClientAuthErrorCodes.tokenRefreshRequired
            );
        }

        // fetch the idToken from cache
        const cachedIdToken = this.readIdTokenFromCacheForOBO(
            cachedAccessToken.homeAccountId,
            request.correlationId
        );
        let idTokenClaims: TokenClaims | undefined;
        let cachedAccount: AccountEntity | null = null;
        if (cachedIdToken) {
            idTokenClaims = AuthToken.extractTokenClaims(
                cachedIdToken.secret,
                EncodingUtils.base64Decode
            );
            const localAccountId = idTokenClaims.oid || idTokenClaims.sub;
            const accountInfo: AccountInfo = {
                homeAccountId: cachedIdToken.homeAccountId,
                environment: cachedIdToken.environment,
                tenantId: cachedIdToken.realm,
                username: "",
                localAccountId: localAccountId || "",
            };

            cachedAccount = this.cacheManager.getAccount(
                this.cacheManager.generateAccountKey(accountInfo),
                request.correlationId
            );
        }

        return ResponseHandler.generateAuthenticationResult(
            this.cryptoUtils,
            this.authority,
            {
                account: cachedAccount,
                accessToken: cachedAccessToken,
                idToken: cachedIdToken,
                refreshToken: null,
                appMetadata: null,
            },
            true,
            request,
            new StubPerformanceClient(),
            idTokenClaims
        );
    }

    /**
     * read idtoken from cache, this is a specific implementation for OBO as the requirements differ from a generic lookup in the cacheManager
     * Certain use cases of OBO flow do not expect an idToken in the cache/or from the service
     * @param atHomeAccountId - account id
     */
    private readIdTokenFromCacheForOBO(
        atHomeAccountId: string,
        correlationId: string
    ): IdTokenEntity | null {
        const idTokenFilter: CredentialFilter = {
            homeAccountId: atHomeAccountId,
            environment:
                this.authority.canonicalAuthorityUrlComponents.HostNameAndPort,
            credentialType: Constants.CredentialType.ID_TOKEN,
            clientId: this.config.auth.clientId,
            realm: this.authority.tenant,
        };

        const idTokenMap: Map<string, IdTokenEntity> =
            this.cacheManager.getIdTokensByFilter(idTokenFilter, correlationId);

        // When acquiring a token on behalf of an application, there might not be an id token in the cache
        if (Object.values(idTokenMap).length < 1) {
            return null;
        }
        return Object.values(idTokenMap)[0] as IdTokenEntity;
    }

    /**
     * Fetches the cached access token based on incoming assertion
     * @param clientId - client id
     * @param request - developer provided CommonOnBehalfOfRequest
     */
    private readAccessTokenFromCacheForOBO(
        clientId: string,
        request: CommonOnBehalfOfRequest
    ) {
        const authScheme =
            request.authenticationScheme ||
            Constants.AuthenticationScheme.BEARER;
        /*
         * Distinguish between Bearer and PoP/SSH token cache types
         * Cast to lowercase to handle "bearer" from ADFS
         */
        const credentialType =
            authScheme &&
            authScheme.toLowerCase() !==
                Constants.AuthenticationScheme.BEARER.toLowerCase()
                ? Constants.CredentialType.ACCESS_TOKEN_WITH_AUTH_SCHEME
                : Constants.CredentialType.ACCESS_TOKEN;

        const accessTokenFilter: CredentialFilter = {
            credentialType: credentialType,
            clientId,
            target: ScopeSet.createSearchScopes(this.scopeSet.asArray()),
            tokenType: authScheme,
            keyId: request.sshKid,
            userAssertionHash: this.userAssertionHash,
        };

        const accessTokens = this.cacheManager.getAccessTokensByFilter(
            accessTokenFilter,
            request.correlationId
        );

        const numAccessTokens = accessTokens.length;
        if (numAccessTokens < 1) {
            return null;
        } else if (numAccessTokens > 1) {
            throw createClientAuthError(
                ClientAuthErrorCodes.multipleMatchingTokens
            );
        }

        return accessTokens[0] as AccessTokenEntity;
    }

    /**
     * Make a network call to the server requesting credentials
     * @param request - developer provided CommonOnBehalfOfRequest
     * @param authority - authority object
     */
    private async executeTokenRequest(
        request: CommonOnBehalfOfRequest,
        authority: Authority,
        userAssertionHash: string,
        serializableCache: TokenCache
    ): Promise<AuthenticationResult | null> {
        const performanceClient = new StubPerformanceClient();
        const queryParametersString = TokenProtocol.createTokenQueryParameters(request, this.config.auth.clientId, "", performanceClient);
        const endpoint = UrlString.appendQueryString(
            authority.tokenEndpoint,
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

        const reqTimestamp = TimeUtils.nowSeconds();
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
            null
        );

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
            response.body,
            request.correlationId
        );
        const tokenResponse = await responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            reqTimestamp,
            request,
            undefined,
            userAssertionHash
        );

        return tokenResponse;
    }

    /**
     * generate a server request in accepable format
     * @param request - developer provided CommonOnBehalfOfRequest
     */
    private async createTokenRequestBody(
        request: CommonOnBehalfOfRequest
    ): Promise<string> {
        const parameters = new Map<string, string>();

        RequestParameterBuilder.addClientId(
            parameters,
            this.config.auth.clientId
        );

        RequestParameterBuilder.addScopes(parameters, request.scopes);

        RequestParameterBuilder.addGrantType(
            parameters,
            Constants.GrantType.JWT_BEARER
        );

        RequestParameterBuilder.addClientInfo(parameters);

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

        const correlationId =
            request.correlationId ||
            this.cryptoUtils.createNewGuid();
        RequestParameterBuilder.addCorrelationId(parameters, correlationId);

        RequestParameterBuilder.addRequestTokenUse(
            parameters,
            AADServerParamKeys.ON_BEHALF_OF
        );

        RequestParameterBuilder.addOboAssertion(
            parameters,
            request.oboAssertion
        );

        if (this.config.auth.clientSecret) {
            RequestParameterBuilder.addClientSecret(
                parameters,
                this.config.auth.clientSecret
            );
        }

        const clientAssertion: ClientAssertion | undefined =
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
            request.claims ||
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
