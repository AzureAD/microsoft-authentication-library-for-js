import { Constants } from "../utils/Constants";
import { INetworkModule } from "../network/INetworkModule";
import { OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { InstanceMetadataType } from "./InstanceMetadataType";
import { IInstanceDiscoveryMetadata } from "./IInstanceDiscoveryMetadata";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

export class TrustedAuthority {
    private static InstanceMetadata: InstanceMetadataType = {};

    /**
     * Set the InstanceMetadata object from knownAuthorities or instanceMetadata passed into the app config
     * @param knownAuthorities 
     * @param instanceMetadata
     */
    public static setTrustedAuthoritiesFromConfig(knownAuthorities: Array<string>, instanceMetadata: Array<IInstanceDiscoveryMetadata>): void {
        if (!this.getTrustedHostList().length){
            if (knownAuthorities.length && instanceMetadata.length) {
                throw ClientConfigurationError.createKnownAuthoritiesInstanceMetadataError();
            }

            this.createInstanceMetadataFromKnownAuthorities(knownAuthorities);
            this.saveInstanceMetadata(instanceMetadata);            
        }
    }

    /**
     * Called to get metadata from network if InstanceMetadata was not populated by config
     * @param networkInterface 
     */
    public static async setTrustedAuthoritiesFromNetwork(networkInterface: INetworkModule): Promise<void> {
        const response = await networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(Constants.AAD_INSTANCE_DISCOVERY_ENDPT);
        const metadata = response.body.metadata;
        this.saveInstanceMetadata(metadata);
    } 

    /**
     * 
     * @param metadata 
     */
    public static saveInstanceMetadata(metadata: Array<IInstanceDiscoveryMetadata>): void {
        metadata.forEach(function(entry: IInstanceDiscoveryMetadata){
            const authorities = entry.aliases;
            authorities.forEach(function(authority) {
                TrustedAuthority.InstanceMetadata[authority.toLowerCase()] = entry;
            });
        });
    }

    /**
     * Create a generic metadata object for each host passed to knownAuthorities.
     * This is mostly useful for B2C or ADFS scenarios
     * @param knownAuthorities 
     */
    public static createInstanceMetadataFromKnownAuthorities(knownAuthorities: Array<string>): void {
        knownAuthorities.forEach(authority => {
            this.InstanceMetadata[authority.toLowerCase()] = {
                preferred_cache: authority.toLowerCase(),
                preferred_network: authority.toLowerCase(),
                aliases: [authority.toLowerCase()]
            };
        });
    }

    public static getTrustedHostList(): Array<string> {
        return Object.keys(this.InstanceMetadata);
    }

    /**
     * Get metadata for the provided host
     * @param host 
     */
    public static getInstanceMetadata(host: string): IInstanceDiscoveryMetadata {
        return this.InstanceMetadata[host.toLowerCase()] || null;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param host 
     */
    public static IsInTrustedHostList(host: string): boolean {
        return Object.keys(this.InstanceMetadata).indexOf(host.toLowerCase()) > -1;
    }
}
