import { Constants } from "../utils/Constants";
import { INetworkModule } from "../network/INetworkModule";
import { ICloudInstanceDiscoveryResponse } from "./ICloudInstanceDiscoveryResponse";
import { CloudDiscoveryMetadataType } from "./CloudDiscoveryMetadataType";
import { ICloudDiscoveryMetadata } from "./ICloudDiscoveryMetadata";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

export class TrustedAuthority {
    private static CloudDiscoveryMetadata: CloudDiscoveryMetadataType = {};

    /**
     * Set the CloudDiscoveryMetadata object from knownAuthorities or cloudDiscoveryMetadata passed into the app config
     * @param knownAuthorities 
     * @param cloudDiscoveryMetadata
     */
    public static setTrustedAuthoritiesFromConfig(knownAuthorities: Array<string>, cloudDiscoveryMetadata: string): void {
        if (!this.getTrustedHostList().length){
            if (knownAuthorities.length && cloudDiscoveryMetadata) {
                throw ClientConfigurationError.createKnownAuthoritiesCloudDiscoveryMetadataError();
            }

            this.createCloudDiscoveryMetadataFromKnownAuthorities(knownAuthorities);
            
            try {
                if (cloudDiscoveryMetadata) {
                    const parsedMetadata = JSON.parse(cloudDiscoveryMetadata) as ICloudInstanceDiscoveryResponse;
                    this.saveCloudDiscoveryMetadata(parsedMetadata.metadata);
                }
            } catch (e) {
                throw ClientConfigurationError.createInvalidCloudDiscoveryMetadataError();
            }
        }
    }

    /**
     * Called to get metadata from network if CloudDiscoveryMetadata was not populated by config
     * @param networkInterface 
     */
    public static async setTrustedAuthoritiesFromNetwork(networkInterface: INetworkModule): Promise<void> {
        const instanceDiscoveryEndpoint = `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}${Constants.DEFAULT_AUTHORITY}oauth2/v2.0/authorize`;
        const response = await networkInterface.sendGetRequestAsync<ICloudInstanceDiscoveryResponse>(instanceDiscoveryEndpoint);
        const metadata = response.body.metadata;
        this.saveCloudDiscoveryMetadata(metadata);
    } 

    /**
     * 
     * @param metadata 
     */
    public static saveCloudDiscoveryMetadata(metadata: Array<ICloudDiscoveryMetadata>): void {
        metadata.forEach(function(entry: ICloudDiscoveryMetadata){
            const authorities = entry.aliases;
            authorities.forEach(function(authority) {
                TrustedAuthority.CloudDiscoveryMetadata[authority.toLowerCase()] = entry;
            });
        });
    }

    /**
     * Create a generic metadata object for each host passed to knownAuthorities.
     * This is mostly useful for B2C or ADFS scenarios
     * @param knownAuthorities 
     */
    public static createCloudDiscoveryMetadataFromKnownAuthorities(knownAuthorities: Array<string>): void {
        knownAuthorities.forEach(authority => {
            this.CloudDiscoveryMetadata[authority.toLowerCase()] = {
                preferred_cache: authority.toLowerCase(),
                preferred_network: authority.toLowerCase(),
                aliases: [authority.toLowerCase()]
            };
        });
    }

    public static getTrustedHostList(): Array<string> {
        return Object.keys(this.CloudDiscoveryMetadata);
    }

    /**
     * Get metadata for the provided host
     * @param host 
     */
    public static getCloudDiscoveryMetadata(host: string): ICloudDiscoveryMetadata {
        return this.CloudDiscoveryMetadata[host.toLowerCase()] || null;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param host 
     */
    public static IsInTrustedHostList(host: string): boolean {
        return Object.keys(this.CloudDiscoveryMetadata).indexOf(host.toLowerCase()) > -1;
    }
}
