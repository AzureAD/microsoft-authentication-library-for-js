/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Authority,
    AuthorityFactory,
    AuthorityOptions,
    AzureCloudOptions,
    AzureRegionConfiguration,
    BaseAuthRequest,
    buildStaticAuthorityOptions,
    Constants,
    Logger,
    ServerTelemetryManager,
    ServerTelemetryRequest,
    StubPerformanceClient,
} from "@azure/msal-common/node";
import {
    buildAppConfiguration,
    Configuration,
    NodeConfiguration,
} from "../config/Configuration.js";
import { CryptoProvider } from "../crypto/CryptoProvider.js";
import { NodeStorage } from "../cache/NodeStorage.js";
import { TokenCache } from "../cache/TokenCache.js";
import { name, version } from "../packageMetadata.js";

/**
 * Internal application infrastructure shared by public and confidential clients.
 */
export abstract class BaseClientApplication {
    protected readonly cryptoProvider: CryptoProvider;
    private tokenCache: TokenCache;

    /**
     * Platform storage object
     */
    protected storage: NodeStorage;
    /**
     * Logger object to log the application flow
     */
    protected logger: Logger;
    /**
     * Platform configuration initialized by the application
     */
    protected config: NodeConfiguration;
    protected constructor(configuration: Configuration) {
        this.config = buildAppConfiguration(configuration);
        this.cryptoProvider = new CryptoProvider();
        this.logger = new Logger(
            this.config.system.loggerOptions,
            name,
            version
        );
        this.storage = new NodeStorage(
            this.logger,
            this.config.auth.clientId,
            this.cryptoProvider,
            buildStaticAuthorityOptions(this.config.auth)
        );
        this.tokenCache = new TokenCache(
            this.storage,
            this.logger,
            this.config.cache.cachePlugin
        );
    }

    /**
     * Gets the token cache for the application.
     */
    getTokenCache(): TokenCache {
        this.logger.info("getTokenCache called", "");
        return this.tokenCache;
    }

    protected getTokenCacheInternal(): TokenCache {
        return this.tokenCache;
    }

    /**
     * Returns the logger instance
     */
    getLogger(): Logger {
        return this.logger;
    }

    /**
     * Replaces the default logger set in configurations with new Logger with new configurations
     * @param logger - Logger instance
     */
    setLogger(logger: Logger): void {
        this.logger = logger;
    }

    /**
     * Generates a request with the default scopes & generates a correlationId.
     * @param authRequest - BaseAuthRequest for initialization
     */
    protected async initializeBaseRequest(
        authRequest: Partial<BaseAuthRequest>
    ): Promise<BaseAuthRequest> {
        const correlationId =
            authRequest.correlationId || this.cryptoProvider.createNewGuid();
        this.logger.verbose("initializeRequestScopes called", correlationId);
        // Default authenticationScheme to Bearer, log that POP isn't supported yet
        if (
            authRequest.authenticationScheme &&
            authRequest.authenticationScheme ===
                Constants.AuthenticationScheme.POP
        ) {
            this.logger.verbose(
                "Authentication Scheme 'pop' is not supported yet, setting Authentication Scheme to 'Bearer' for request",
                correlationId
            );
        }

        authRequest.authenticationScheme =
            Constants.AuthenticationScheme.BEARER;

        return {
            ...authRequest,
            scopes: [
                ...((authRequest && authRequest.scopes) || []),
                ...Constants.OIDC_DEFAULT_SCOPES,
            ],
            correlationId,
            authority: authRequest.authority || this.config.auth.authority,
        };
    }

    /**
     * Initializes the server telemetry payload
     * @param apiId - Id for a specific request
     * @param correlationId - GUID
     * @param forceRefresh - boolean to indicate network call
     */
    protected initializeServerTelemetryManager(
        apiId: number,
        correlationId: string,
        forceRefresh?: boolean
    ): ServerTelemetryManager {
        const telemetryPayload: ServerTelemetryRequest = {
            clientId: this.config.auth.clientId,
            correlationId: correlationId,
            apiId: apiId,
            forceRefresh: forceRefresh || false,
        };

        return new ServerTelemetryManager(telemetryPayload, this.storage);
    }

    /**
     * Create authority instance. If authority not passed in request, default to authority set on the application
     * object. If no authority set in application object, then default to common authority.
     * @param authorityString - authority from user configuration
     */
    protected async createAuthority(
        authorityString: string,
        requestCorrelationId: string,
        azureRegionConfiguration?: AzureRegionConfiguration,
        azureCloudOptions?: AzureCloudOptions
    ): Promise<Authority> {
        this.logger.verbose("createAuthority called", requestCorrelationId);

        // build authority string based on auth params - azureCloudInstance is prioritized if provided
        const authorityUrl = Authority.generateAuthority(
            authorityString,
            azureCloudOptions || this.config.auth.azureCloudOptions
        );

        const authorityOptions: AuthorityOptions = {
            protocolMode: this.config.system.protocolMode,
            knownAuthorities: this.config.auth.knownAuthorities,
            cloudDiscoveryMetadata: this.config.auth.cloudDiscoveryMetadata,
            authorityMetadata: this.config.auth.authorityMetadata,
            azureRegionConfiguration,
        };

        return AuthorityFactory.createDiscoveredInstance(
            authorityUrl,
            this.config.system.networkClient,
            this.storage,
            authorityOptions,
            this.logger,
            requestCorrelationId,
            new StubPerformanceClient()
        );
    }

    /**
     * Clear the cache except for authority metadata.
     */
    clearCache(): void {
        this.storage.clear();
    }
}
