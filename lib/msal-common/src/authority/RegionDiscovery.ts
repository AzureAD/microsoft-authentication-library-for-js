/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { NetworkResponse } from "../network/NetworkManager";
import { IMDSBadResponse } from "../response/IMDSBadResponse";
import {
    Constants,
    RegionDiscoverySources,
    ResponseCodes,
} from "../utils/Constants";
import { RegionDiscoveryMetadata } from "./RegionDiscoveryMetadata";
import { ImdsOptions } from "./ImdsOptions";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
import { PerformanceEvents } from "../telemetry/performance/PerformanceEvent";
import { invokeAsync } from "../utils/FunctionWrappers";
import { Logger } from "../logger/Logger";

export class RegionDiscovery {
    // Network interface to make requests with.
    protected networkInterface: INetworkModule;
    // Logger
    private logger: Logger;
    // Performance client
    protected performanceClient: IPerformanceClient | undefined;
    // CorrelationId
    protected correlationId: string | undefined;
    // Options for the IMDS endpoint request
    protected static IMDS_OPTIONS: ImdsOptions = {
        headers: {
            Metadata: "true",
        },
    };

    constructor(
        networkInterface: INetworkModule,
        logger: Logger,
        performanceClient?: IPerformanceClient,
        correlationId?: string
    ) {
        this.networkInterface = networkInterface;
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.correlationId = correlationId;
    }

    /**
     * Detect the region from the application's environment.
     *
     * @returns Promise<string | null>
     */
    public async detectRegion(
        environmentRegion: string | undefined,
        regionDiscoveryMetadata: RegionDiscoveryMetadata
    ): Promise<string | null> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RegionDiscoveryDetectRegion,
            this.correlationId
        );

        // Initialize auto detected region with the region from the envrionment
        let autodetectedRegionName = environmentRegion;

        // Check if a region was detected from the environment, if not, attempt to get the region from IMDS
        if (!autodetectedRegionName) {
            const options = RegionDiscovery.IMDS_OPTIONS;

            try {
                const localIMDSVersionResponse = await invokeAsync(
                    this.getRegionFromIMDS.bind(this),
                    PerformanceEvents.RegionDiscoveryGetRegionFromIMDS,
                    this.logger,
                    this.performanceClient,
                    this.correlationId
                )(Constants.IMDS_VERSION, options);
                if (
                    localIMDSVersionResponse.status ===
                    ResponseCodes.httpSuccess
                ) {
                    autodetectedRegionName = localIMDSVersionResponse.body;
                    regionDiscoveryMetadata.region_source =
                        RegionDiscoverySources.IMDS;
                }

                // If the response using the local IMDS version failed, try to fetch the current version of IMDS and retry.
                if (
                    localIMDSVersionResponse.status ===
                    ResponseCodes.httpBadRequest
                ) {
                    const currentIMDSVersion = await invokeAsync(
                        this.getCurrentVersion.bind(this),
                        PerformanceEvents.RegionDiscoveryGetCurrentVersion,
                        this.logger,
                        this.performanceClient,
                        this.correlationId
                    )(options);
                    if (!currentIMDSVersion) {
                        regionDiscoveryMetadata.region_source =
                            RegionDiscoverySources.FAILED_AUTO_DETECTION;
                        return null;
                    }

                    const currentIMDSVersionResponse = await invokeAsync(
                        this.getRegionFromIMDS.bind(this),
                        PerformanceEvents.RegionDiscoveryGetRegionFromIMDS,
                        this.logger,
                        this.performanceClient,
                        this.correlationId
                    )(currentIMDSVersion, options);
                    if (
                        currentIMDSVersionResponse.status ===
                        ResponseCodes.httpSuccess
                    ) {
                        autodetectedRegionName =
                            currentIMDSVersionResponse.body;
                        regionDiscoveryMetadata.region_source =
                            RegionDiscoverySources.IMDS;
                    }
                }
            } catch (e) {
                regionDiscoveryMetadata.region_source =
                    RegionDiscoverySources.FAILED_AUTO_DETECTION;
                return null;
            }
        } else {
            regionDiscoveryMetadata.region_source =
                RegionDiscoverySources.ENVIRONMENT_VARIABLE;
        }

        // If no region was auto detected from the environment or from the IMDS endpoint, mark the attempt as a FAILED_AUTO_DETECTION
        if (!autodetectedRegionName) {
            regionDiscoveryMetadata.region_source =
                RegionDiscoverySources.FAILED_AUTO_DETECTION;
        }

        return autodetectedRegionName || null;
    }

    /**
     * Make the call to the IMDS endpoint
     *
     * @param imdsEndpointUrl
     * @returns Promise<NetworkResponse<string>>
     */
    private async getRegionFromIMDS(
        version: string,
        options: ImdsOptions
    ): Promise<NetworkResponse<string>> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RegionDiscoveryGetRegionFromIMDS,
            this.correlationId
        );
        return this.networkInterface.sendGetRequestAsync<string>(
            `${Constants.IMDS_ENDPOINT}?api-version=${version}&format=text`,
            options,
            Constants.IMDS_TIMEOUT
        );
    }

    /**
     * Get the most recent version of the IMDS endpoint available
     *
     * @returns Promise<string | null>
     */
    private async getCurrentVersion(
        options: ImdsOptions
    ): Promise<string | null> {
        this.performanceClient?.addQueueMeasurement(
            PerformanceEvents.RegionDiscoveryGetCurrentVersion,
            this.correlationId
        );
        try {
            const response =
                await this.networkInterface.sendGetRequestAsync<IMDSBadResponse>(
                    `${Constants.IMDS_ENDPOINT}?format=json`,
                    options
                );

            // When IMDS endpoint is called without the api version query param, bad request response comes back with latest version.
            if (
                response.status === ResponseCodes.httpBadRequest &&
                response.body &&
                response.body["newest-versions"] &&
                response.body["newest-versions"].length > 0
            ) {
                return response.body["newest-versions"][0];
            }

            return null;
        } catch (e) {
            return null;
        }
    }
}
