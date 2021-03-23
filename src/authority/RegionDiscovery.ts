/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { IMDSBadResponse } from "../response/IMDSBadResponse";

export class RegionDiscovery {
    // Network interface to make requests with.
    protected networkInterface: INetworkModule;
    // The IMDS endpoint to retrieve region information.
    protected static IMDS_ENDPOINT = "http://169.254.169.254/metadata/instance/compute/location";
    // Options for the IMDS endpoint request
    protected static IMDS_OPTIONS = {headers: {"Metadata": "true"}};
    // The version of the IMDS endpoint to use
    protected static VERSION = "2020-06-01";
    // Region variable name
    protected static REGION_ENV_NAME = "REGION_NAME";

    constructor(networkInterface: INetworkModule) {
        this.networkInterface = networkInterface;
    }

    /**
     * Detect the region from the application's environment.
     * 
     * @returns Promise<string | null>
     */
    public async detectRegion(): Promise<string | null> {
        // Detect region from the process environment variable
        let autodetectedRegionName = process.env[RegionDiscovery.REGION_ENV_NAME];

        // Call the local IMDS endpoint for applications running in azure vms
        if (!autodetectedRegionName) {
            try {
                const response = await this.networkInterface.sendGetRequestAsync<string>(this.buildIMDSEndpoint(RegionDiscovery.IMDS_ENDPOINT, RegionDiscovery.VERSION), RegionDiscovery.IMDS_OPTIONS);
                if (response.status === 200) {
                    autodetectedRegionName = response.body;
                } 
                
                if (response.status === 400) {
                    const latestIMDSVersion = await this.getCurrentVersion();
                    if (!latestIMDSVersion) {
                        return null;
                    }

                    const response = await this.networkInterface.sendGetRequestAsync<string>(this.buildIMDSEndpoint(RegionDiscovery.IMDS_ENDPOINT, latestIMDSVersion), RegionDiscovery.IMDS_OPTIONS);
                    if (response.status === 200) {
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
     * Construct the IMDS endpoint url
     * 
     * @param imdsEndpoint 
     * @param version 
     * @returns string 
     */
    private buildIMDSEndpoint(imdsEndpoint: string, version: string): string {
        return `${imdsEndpoint}?api-version=${version}&format=text`;
    }

    /**
     * Get the most recent version of the IMDS endpoint available
     *  
     * @returns Promise<string | null>
     */
    private async getCurrentVersion(): Promise<string | null> {
        try {
            const response = await this.networkInterface.sendGetRequestAsync<IMDSBadResponse>(`${RegionDiscovery.IMDS_ENDPOINT}?format=json`, RegionDiscovery.IMDS_OPTIONS);

            // When IMDS endpoint is called without the api version query param, bad request response comes back with latest version.
            if (response.status === 400) {
                return response.body["newest-versions"][0];
            }

            return null;
        } catch (e) {
            return null;
        }
    }
}
