/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfiguration, buildClientConfiguration, CommonClientConfiguration } from "../config/ClientConfiguration";
import { INetworkModule } from "../network/INetworkModule";
import { NetworkManager, NetworkResponse } from "../network/NetworkManager";
import { ICrypto } from "../crypto/ICrypto";
import { Authority } from "../authority/Authority";
import { Logger } from "../logger/Logger";
import { Constants, HeaderNames } from "../utils/Constants";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { CacheManager } from "../cache/CacheManager";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { version, name } from "../packageMetadata";
import { ClientAuthError } from "../error/ClientAuthError";
import { CcsCredential, CcsCredentialType } from "../account/CcsCredential";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";

/**
 * Base application class which will construct requests to send to and handle responses from the Microsoft STS using the authorization code flow.
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

    protected constructor(configuration: ClientConfiguration, performanceClient?: IPerformanceClient) {
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
        this.networkManager = new NetworkManager(this.networkClient, this.cacheManager);

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
    protected createTokenRequestHeaders(ccsCred?: CcsCredential): Record<string, string> {   
        const headers: Record<string, string> = {};
        headers[HeaderNames.CONTENT_TYPE] = Constants.URL_FORM_CONTENT_TYPE;

        if (!this.config.systemOptions.preventCorsPreflight && ccsCred) {
            switch (ccsCred.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                        headers[HeaderNames.CCS_HEADER] = `Oid:${clientInfo.uid}@${clientInfo.utid}`;
                    } catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                    }
                    break;
                case CcsCredentialType.UPN:
                    headers[HeaderNames.CCS_HEADER] = `UPN: ${ccsCred.credential}`;
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
    protected async executePostToTokenEndpoint(tokenEndpoint: string, queryString: string, headers: Record<string, string>, thumbprint: RequestThumbprint): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const response = await this.networkManager.sendPostRequest<ServerAuthorizationTokenResponse>(
            thumbprint,
            tokenEndpoint,
            { body: queryString, headers: headers, proxyUrl: this.config.systemOptions.proxyUrl }
        );

        if (this.config.serverTelemetryManager && response.status < 500 && response.status !== 429) {
            // Telemetry data successfully logged by server, clear Telemetry cache
            this.config.serverTelemetryManager.clearTelemetryCache();
        }

        return response;
    }

    /**
     * Updates the authority object of the client. Endpoint discovery must be completed.
     * @param updatedAuthority
     */
    updateAuthority(updatedAuthority: Authority): void {
        if (!updatedAuthority.discoveryComplete()) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError("Updated authority has not completed endpoint discovery.");
        }
        this.authority = updatedAuthority;
    }
}
