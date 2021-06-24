/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { NetworkResponse } from "../network/NetworkManager";
import { IMDSBadResponse } from "../response/IMDSBadResponse";
import { Constants, ResponseCodes } from "../utils/Constants";

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
    public async detectRegion(environmentRegion: string | undefined): Promise<string | null> {
        // Initialize auto detected region with the region from the envrionment 
        let autodetectedRegionName = environmentRegion;

        // Call the local IMDS endpoint for applications running in azure vms
        if (!autodetectedRegionName) {
            try {
                const response = await this.getRegionFromIMDS(Constants.IMDS_VERSION);
                if (response.status === ResponseCodes.httpSuccess) {
                    autodetectedRegionName = response.body;
                } 
                
                if (response.status === ResponseCodes.httpBadRequest) {
                    const latestIMDSVersion = await this.getCurrentVersion();
                    if (!latestIMDSVersion) {
                        return null;
                    }

                    const response = await this.getRegionFromIMDS(latestIMDSVersion);
                    if (response.status === ResponseCodes.httpSuccess) {
                        autodetectedRegionName = response.body;
                    }
                } 
            } catch(e) {
                return null;
            } 
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
