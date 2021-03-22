/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";

export class RegionDiscovery {
    // Network interface to make requests with.
    protected networkInterface: INetworkModule;
    // The IMDS endpoint to retrieve region information.
    protected static IMDS_ENDPOINT = "http://169.254.169.254/metadata/instance/compute/location?api-version=2020-06-01&format=text";
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
        // eslint-disable-next-line no-console
        console.log(`Auto detected region name from environment variable ["REGION_NAME"]: ${autodetectedRegionName}`);
        // Call the local IMDS endpoint for applications running in azure vms
        if (!autodetectedRegionName) {
            try {
                const response = await this.networkInterface.sendGetRequestAsync<string>(RegionDiscovery.IMDS_ENDPOINT);
                autodetectedRegionName = response.body;
                // eslint-disable-next-line no-console
                console.log(`Auto detected region from IMDS endpoint: ${JSON.stringify(autodetectedRegionName)}`);
            } catch(e) {
                return null;
            } 
        }

        return autodetectedRegionName || null;
    }
}
