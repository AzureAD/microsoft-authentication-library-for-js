/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { NetworkResponse } from "../network/NetworkManager";
import { IMDSBadResponse } from "../response/IMDSBadResponse";
import { Constants, RegionDiscoverySources, ResponseCodes } from "../utils/Constants";
import { RegionDiscoveryMetadata } from "./RegionDiscoveryMetadata";

export class RegionDiscovery {
    // Network interface to make requests with.
    protected networkInterface: INetworkModule;
    // Options for the IMDS endpoint request
    protected static IMDS_OPTIONS = {headers: {"Metadata": "true"}};

    constructor(networkInterface: INetworkModule) {
        this.networkInterface = networkInterface;
    }

    /**
     * Detect the region from the application's environment.
     * 
     * @returns Promise<string | null>
     */
    public async detectRegion(environmentRegion: string | undefined, regionDiscoveryMetadata: RegionDiscoveryMetadata): Promise<string | null> {
        // Initialize auto detected region with the region from the envrionment 
        let autodetectedRegionName = environmentRegion;

        // Check if a region was detected from the environment, if not, attempt to get the region from IMDS 
        if (!autodetectedRegionName) {
            try {
                const localIMDSVersionResponse = await this.getRegionFromIMDS(Constants.IMDS_VERSION);
                if (localIMDSVersionResponse.status === ResponseCodes.httpSuccess) {
                    autodetectedRegionName = localIMDSVersionResponse.body;
                    regionDiscoveryMetadata.region_source = RegionDiscoverySources.IMDS;
                } 
                
                // If the response using the local IMDS version failed, try to fetch the current version of IMDS and retry. 
                if (localIMDSVersionResponse.status === ResponseCodes.httpBadRequest) {
                    const currentIMDSVersion = await this.getCurrentVersion();
                    if (!currentIMDSVersion) {
                        regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
                        return null;
                    }

                    const currentIMDSVersionResponse = await this.getRegionFromIMDS(currentIMDSVersion);
                    if (currentIMDSVersionResponse.status === ResponseCodes.httpSuccess) {
                        autodetectedRegionName = currentIMDSVersionResponse.body;
                        regionDiscoveryMetadata.region_source = RegionDiscoverySources.IMDS;
                    }
                }
            } catch(e) {
                regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
                return null;
            } 
        } else {
            regionDiscoveryMetadata.region_source = RegionDiscoverySources.ENVIRONMENT_VARIABLE;
        }

        // If no region was auto detected from the environment or from the IMDS endpoint, mark the attempt as a FAILED_AUTO_DETECTION
        if (!autodetectedRegionName) {
            regionDiscoveryMetadata.region_source = RegionDiscoverySources.FAILED_AUTO_DETECTION;
        }

        return autodetectedRegionName || null;
    }

    /**
     * Make the call to the IMDS endpoint
     * 
     * @param imdsEndpointUrl
     * @returns Promise<NetworkResponse<string>>
     */
    private async getRegionFromIMDS(version: string): Promise<NetworkResponse<string>> {
        return this.networkInterface.sendGetRequestAsync<string>(`${Constants.IMDS_ENDPOINT}?api-version=${version}&format=text`, RegionDiscovery.IMDS_OPTIONS, Constants.IMDS_TIMEOUT);
    }

    /**
     * Get the most recent version of the IMDS endpoint available
     *  
     * @returns Promise<string | null>
     */
    private async getCurrentVersion(): Promise<string | null> {
        try {
            const response = await this.networkInterface.sendGetRequestAsync<IMDSBadResponse>(`${Constants.IMDS_ENDPOINT}?format=json`, RegionDiscovery.IMDS_OPTIONS);

            // When IMDS endpoint is called without the api version query param, bad request response comes back with latest version.
            if (response.status === ResponseCodes.httpBadRequest && response.body && response.body["newest-versions"] && response.body["newest-versions"].length > 0) {
                return response.body["newest-versions"][0];
            }

            return null;
        } catch (e) {
            return null;
        }
    }
}
