/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ClientConfiguration,
    buildClientConfiguration,
    CommonClientConfiguration,
} from "../config/ClientConfiguration.js";
import { INetworkModule } from "../network/INetworkModule.js";
import { NetworkManager, NetworkResponse } from "../network/NetworkManager.js";
import { ICrypto } from "../crypto/ICrypto.js";
import { Authority } from "../authority/Authority.js";
import { Logger } from "../logger/Logger.js";
import { Constants, HeaderNames } from "../utils/Constants.js";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse.js";
import { CacheManager } from "../cache/CacheManager.js";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager.js";
import { RequestThumbprint } from "../network/RequestThumbprint.js";
import { version, name } from "../packageMetadata.js";
import { CcsCredential, CcsCredentialType } from "../account/CcsCredential.js";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo.js";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient.js";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder.js";
import { BaseAuthRequest } from "../request/BaseAuthRequest.js";
import { createDiscoveredInstance } from "../authority/AuthorityFactory.js";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent.js";

/**
 * Base application class which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
 * @internal
 */
export abstract class BaseClient {
    // Logger object
    public logger: Logger;

    // Application config
    protected config: CommonClientConfiguration;

    // Crypto Interface
    protected cryptoUtils: ICrypto;

    // Storage Interface
    protected cacheManager: CacheManager;

    // Network Interface
    protected networkClient: INetworkModule;

    // Server Telemetry Manager
    protected serverTelemetryManager: ServerTelemetryManager | null;

    // Network Manager
    protected networkManager: NetworkManager;

    // Default authority object
    public authority: Authority;

    // Performance telemetry client
    protected performanceClient?: IPerformanceClient;

    protected constructor(
        configuration: ClientConfiguration,
        performanceClient?: IPerformanceClient
    ) {
        // Set the configuration
        this.config = buildClientConfiguration(configuration);

        // Initialize the logger
        this.logger = new Logger(this.config.loggerOptions, name, version);

        // Initialize crypto
        this.cryptoUtils = this.config.cryptoInterface;

        // Initialize storage interface
        this.cacheManager = this.config.storageInterface;

        // Set the network interface
        this.networkClient = this.config.networkInterface;

        // Set the NetworkManager
        this.networkManager = new NetworkManager(
            this.networkClient,
            this.cacheManager
        );

        // Set TelemetryManager
        this.serverTelemetryManager = this.config.serverTelemetryManager;

        // set Authority
        this.authority = this.config.authOptions.authority;

        // set performance telemetry client
        this.performanceClient = performanceClient;
    }

    /**
     * Creates default headers for requests to token endpoint
     */
    protected createTokenRequestHeaders(
        ccsCred?: CcsCredential
    ): Record<string, string> {
        const headers: Record<string, string> = {};
        headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;
        if (!this.config.systemOptions.preventCorsPreflight && ccsCred) {
            switch (ccsCred.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(
                            ccsCred.credential
                        );
                        headers[
                            HeaderNames.CCS_HEADER
                        ] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
                    } catch (e) {
                        this.logger.verbose(
                            "Could not parse home account ID for CCS Header: " +
                                e
                        );
                    }
                    break;
                case CcsCredentialType.UPN:
                    headers[
                        HeaderNames.CCS_HEADER
                    ] = `UPN: ${ccsCred.credential}`;
                    break;
            }
        }
        return headers;
    }

    /**
     * Http post to token endpoint
     * @param tokenEndpoint
     * @param queryString
     * @param headers
     * @param thumbprint
     */
    protected async executePostToTokenEndpoint(
        tokenEndpoint: string,
        queryString: string,
        headers: Record<string, string>,
        thumbprint: RequestThumbprint,
        correlationId: string,
        queuedEvent?: string
    ): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        if (queuedEvent) {
            this.performanceClient?.addQueueMeasurement(
                queuedEvent,
                correlationId
            );
        }

        const response =
            await this.networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
                thumbprint,
                tokenEndpoint,
                { body: queryString, headers: headers }
            );
        this.performanceClient?.addFields(
            {
                refreshTokenSize: response.body.refresh_token?.length || 0,
                httpVerToken:
                    response.headers?.[HeaderNames.X_MS_HTTP_VERSION] || "",
            },
            correlationId
        );

        if (
            this.config.serverTelemetryManager &&
            response.status < 500 &&
            response.status !== 429
        ) {
            // Telemetry data successfully logged by server, clear Telemetry cache
            this.config.serverTelemetryManager.clearTelemetryCache();
        }

        return response;
    }

    /**
     * Updates the authority object of the client. Endpoint discovery must be completed.
     * @param updatedAuthority
     */
    async updateAuthority(
        cloudInstanceHostname: string,
        correlationId: string
    ): Promise<void> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.UpdateTokenEndpointAuthority,
            correlationId
        );
        const cloudInstanceAuthorityUri = `https://${cloudInstanceHostname}/${this.authority.tenant}/`;
        const cloudInstanceAuthority = await createDiscoveredInstance(
            cloudInstanceAuthorityUri,
            this.networkClient,
            this.cacheManager,
            this.authority.options,
            this.logger,
            correlationId,
            this.performanceClient
        );
        this.authority = cloudInstanceAuthority;
    }

    /**
     * Creates query string for the /token request
     * @param request
     */
    createTokenQueryParameters(request: BaseAuthRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.tokenQueryParameters) {
            parameterBuilder.addExtraQueryParameters(
                request.tokenQueryParameters
            );
        }

        return parameterBuilder.createQueryString();
    }
}
