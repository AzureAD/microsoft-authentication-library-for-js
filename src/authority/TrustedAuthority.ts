import { Constants } from "../utils/Constants";
import { INetworkModule } from "../network/INetworkModule";
import { CloudInstanceDiscoveryResponse } from "./CloudInstanceDiscoveryResponse";
import { TrustedHostListType } from "./TrustedHostListType";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { CloudDiscoveryMetadata } from "./CloudDiscoveryMetadata";
import { StringUtils } from "../utils/StringUtils";
import { UrlString } from "../url/UrlString";

export class TrustedAuthority {
    private static TrustedHostList: TrustedHostListType = {};

    /**
     * Set the CloudDiscoveryMetadata object from knownAuthorities or cloudDiscoveryMetadata passed into the app config
     * @param knownAuthorities 
     * @param cloudDiscoveryMetadata
     */
    static setTrustedAuthoritiesFromConfig(knownAuthorities: Array<string>, cloudDiscoveryMetadata: string): void {
        if (!this.getTrustedHostList().length){
            if (knownAuthorities.length > 0 && !StringUtils.isEmpty(cloudDiscoveryMetadata)) {
                throw ClientConfigurationError.createKnownAuthoritiesCloudDiscoveryMetadataError();
            }

            this.createCloudDiscoveryMetadataFromKnownAuthorities(knownAuthorities);
            
            try {
                if (cloudDiscoveryMetadata) {
                    const parsedMetadata = JSON.parse(cloudDiscoveryMetadata) as CloudInstanceDiscoveryResponse;
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
    public static async setTrustedAuthoritiesFromNetwork(authorityToVerify: UrlString, networkInterface: INetworkModule): Promise<void> {
        const instanceDiscoveryEndpoint = `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}${authorityToVerify.urlString}oauth2/v2.0/authorize`;
        try {
            const response = await networkInterface.sendGetRequestAsync<CloudInstanceDiscoveryResponse>(instanceDiscoveryEndpoint);
            const metadata = response.body.metadata;
            this.saveCloudDiscoveryMetadata(metadata);
        } catch(e) {
            return;
        }

        const host = authorityToVerify.getUrlComponents().HostNameAndPort;
        if (this.getTrustedHostList().length > 0 && !this.IsInTrustedHostList(host)) {
            // Custom Domain scenario, host is trusted because Instance Discovery call succeeded 
            this.createCloudDiscoveryMetadataFromKnownAuthorities([host]);
        }
    } 

    /**
     * 
     * @param metadata 
     */
    public static saveCloudDiscoveryMetadata(metadata: Array<CloudDiscoveryMetadata>): void {
        metadata.forEach(function(entry: CloudDiscoveryMetadata){
            const authorities = entry.aliases;
            authorities.forEach(function(authority) {
                TrustedAuthority.TrustedHostList[authority.toLowerCase()] = entry;
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
            const authorityDomain = UrlString.getDomainFromUrl(authority).toLowerCase();
            this.TrustedHostList[authorityDomain] = {
                preferred_cache: authorityDomain,
                preferred_network: authorityDomain,
                aliases: [authorityDomain]
            };
        });
    }

    public static getTrustedHostList(): Array<string> {
        return Object.keys(this.TrustedHostList);
    }

    /**
     * Get metadata for the provided host
     * @param host 
     */
    public static getCloudDiscoveryMetadata(host: string): CloudDiscoveryMetadata {
        return this.TrustedHostList[host.toLowerCase()] || null;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param host 
     */
    public static IsInTrustedHostList(host: string): boolean {
        return Object.keys(this.TrustedHostList).indexOf(host.toLowerCase()) > -1;
    }
}
