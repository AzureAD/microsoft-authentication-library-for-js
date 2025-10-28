/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    Authority,
    CcsCredentialType,
    ClientAssertion,
    NetworkResponse,
    Constants,
    RequestParameterBuilder,
    RequestThumbprint,
    ResponseHandler,
    ServerAuthorizationTokenResponse,
    StringUtils,
    TimeUtils,
    UrlString,
    UrlUtils,
    getClientAssertion,
    StubPerformanceClient,
    TokenProtocol,
    Logger,
    ICrypto,
    CacheManager,
    INetworkModule,
    ServerTelemetryManager,
} from "@azure/msal-common/node";
import { CommonUsernamePasswordRequest } from "../request/CommonUsernamePasswordRequest.js";
import { NodeConfiguration } from "../config/Configuration.js";
import { NodeStorage } from "../cache/NodeStorage.js";
import { TokenCache } from "../cache/TokenCache.js";
import { Constants as NodeConstants } from "../utils/Constants.js";
import { version } from "../packageMetadata.js";

/**
 * Oauth2.0 Password grant client
 * Note: We are only supporting public clients for password grant and for purely testing purposes
 * @public
 * @deprecated - Use a more secure flow instead
 */
export class UsernamePasswordClient {
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

    // Server Telemetry Manager
    protected serverTelemetryManager: ServerTelemetryManager;

    // Default authority object
    public authority: Authority;

    constructor(configuration: NodeConfiguration, clientAssertion: ClientAssertion, logger: Logger, crypto: ICrypto, cacheManager: NodeStorage, serverTelemetryManager: ServerTelemetryManager, discoveredAuthority: Authority) {
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

        // Set TelemetryManager
        this.serverTelemetryManager = serverTelemetryManager;

        // set Authority
        this.authority = discoveredAuthority;
    }

    /**
     * API to acquire a token by passing the username and password to the service in exchage of credentials
     * password_grant
     * @param request - CommonUsernamePasswordRequest
     */
    async acquireToken(
        request: CommonUsernamePasswordRequest,
        serializableCache: TokenCache
    ): Promise<AuthenticationResult | null> {
        this.logger.info(
            "in acquireToken call in username-password client",
            request.correlationId
        );

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executeTokenRequest(
            this.authority,
            request
        );

        const responseHandler = new ResponseHandler(
            this.config.auth.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            new StubPerformanceClient(),
            serializableCache,
            this.config.cache.cachePlugin || null
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(
            response.body,
            request.correlationId
        );
        const tokenResponse = responseHandler.handleServerTokenResponse(
            response.body,
            this.authority,
            reqTimestamp,
            request
        );

        return tokenResponse;
    }

    /**
     * Executes POST request to token endpoint
     * @param authority - authority object
     * @param request - CommonUsernamePasswordRequest provided by the developer
     */
    private async executeTokenRequest(
        authority: Authority,
        request: CommonUsernamePasswordRequest
    ): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const performanceClient = new StubPerformanceClient();
        const queryParametersString = TokenProtocol.createTokenQueryParameters(request, this.config.auth.clientId, "", performanceClient);
        const endpoint = UrlString.appendQueryString(
            authority.tokenEndpoint,
            queryParametersString
        );
        const requestBody = await this.createTokenRequestBody(request);
        const headers: Record<string, string> = TokenProtocol.createTokenRequestHeaders(
            this.logger,
            false,
            {
            credential: request.username,
            type: CcsCredentialType.UPN,
        });
        const thumbprint: RequestThumbprint = {
            clientId: this.config.auth.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes,
            claims: request.claims,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshKid: request.sshKid,
        };

        return TokenProtocol.executePostToTokenEndpoint(
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
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request - CommonUsernamePasswordRequest provided by the developer
     */
    private async createTokenRequestBody(
        request: CommonUsernamePasswordRequest
    ): Promise<string> {
        const parameters = new Map<string, string>();

        RequestParameterBuilder.addClientId(
            parameters,
            this.config.auth.clientId
        );
        RequestParameterBuilder.addUsername(parameters, request.username);
        RequestParameterBuilder.addPassword(parameters, request.password);

        RequestParameterBuilder.addScopes(parameters, request.scopes);

        RequestParameterBuilder.addResponseType(
            parameters,
            Constants.OAuthResponseType.IDTOKEN_TOKEN
        );

        RequestParameterBuilder.addGrantType(
            parameters,
            Constants.GrantType.RESOURCE_OWNER_PASSWORD_GRANT
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

        if (
            request.username
        ) {
            RequestParameterBuilder.addCcsUpn(parameters, request.username);
        }

        return UrlUtils.mapToQueryString(parameters);
    }
}
