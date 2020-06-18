import { Constants } from "../utils/Constants";
import { INetworkModule } from "../network/INetworkModule";
import { OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { NetworkResponse } from "../network/NetworkManager";
import { InstanceMetadataType } from "./InstanceMetadataType";
import { IInstanceDiscoveryMetadata } from "./IInstanceDiscoveryMetadata";

export class TrustedAuthority {
    private static InstanceMetadata: InstanceMetadataType = {};

    /**
     * 
     * @param validateAuthority 
     * @param knownAuthorities 
     */
    public static setTrustedAuthoritiesFromConfig(knownAuthorities: Array<string>, instanceMetadata: Array<IInstanceDiscoveryMetadata>) {

        if (!this.getTrustedHostList().length){
            if (knownAuthorities.length && instanceMetadata.length) {
                // TODO Put better error here
                throw "Cannot pass both knownAuthorities and instanceMetadata";
            }

            this.createInstanceMetadataFromKnownAuthorities(knownAuthorities);
            this.saveInstanceMetadata(instanceMetadata);            
        }
    }

    /**
     * 
     * @param telemetryManager 
     * @param correlationId 
     */
    private static async getAliases(networkInterface: INetworkModule): Promise<NetworkResponse<OpenIdConfigResponse>> {
        return networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(Constants.AAD_INSTANCE_DISCOVERY_ENDPT);
    }

    /**
     * 
     * @param telemetryManager 
     * @param correlationId 
     */
    public static async setTrustedAuthoritiesFromNetwork(networkInterface: INetworkModule): Promise<void> {
        const response = await this.getAliases(networkInterface);
        const metadata = response.body.metadata;
        this.saveInstanceMetadata(metadata);
    } 

    public static saveInstanceMetadata(metadata: Array<IInstanceDiscoveryMetadata>): void {
        metadata.forEach(function(entry: IInstanceDiscoveryMetadata){
            const authorities = entry.aliases;
            authorities.forEach(function(authority) {
                TrustedAuthority.InstanceMetadata[authority.toLowerCase()] = entry;
            });
        });
    }

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
