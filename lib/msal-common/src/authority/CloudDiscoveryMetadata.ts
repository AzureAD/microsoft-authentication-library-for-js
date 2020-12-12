/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { INetworkModule } from "../network/INetworkModule";
import { UrlString } from "../url/UrlString";
import { Constants } from "../utils/Constants";
import { CloudInstanceDiscoveryResponse } from "./CloudInstanceDiscoveryResponse";

export class CloudDiscoveryMetadata {
    preferred_network: string;
    preferred_cache: string;
    aliases: Array<string>;

    static createCloudDiscoveryMetadataFromHost(host: string): CloudDiscoveryMetadata {
        return {
            preferred_network: host,
            preferred_cache: host,
            aliases: [host]
        };
    }

    static getMetadataFromNetworkResponse(response: CloudDiscoveryMetadata[], authority: string): CloudDiscoveryMetadata | null {
        return response.find((metadata: CloudDiscoveryMetadata) => {
            if (metadata.aliases.indexOf(authority) > -1) {
                return true;
            }
            return false;
        }) || null;
    }

    /**
     * Called to get metadata from network if CloudDiscoveryMetadata was not populated by config
     * @param networkInterface 
     */
    static async getCloudDiscoveryMetadataFromNetwork(authority: string, networkInterface: INetworkModule): Promise<CloudDiscoveryMetadata | null> {
        const instanceDiscoveryEndpoint = `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}${authority}oauth2/v2.0/authorize`;
        const host = UrlString.getDomainFromUrl(authority).toLowerCase();
        let match = null;
        try {
            const response = await networkInterface.sendGetRequestAsync<CloudInstanceDiscoveryResponse>(instanceDiscoveryEndpoint);
            const metadata = response.body.metadata;
            match = CloudDiscoveryMetadata.getMetadataFromNetworkResponse(metadata, host);
        } catch(e) {
            return null;
        }

        if (!match) {
            // Custom Domain scenario, host is trusted because Instance Discovery call succeeded 
            match = CloudDiscoveryMetadata.createCloudDiscoveryMetadataFromHost(host);
        }
        return match;
    } 
}
