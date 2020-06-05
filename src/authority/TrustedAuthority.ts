import { Constants } from "../utils/Constants";
import { INetworkModule } from "../network/INetworkModule";
import { OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { NetworkResponse } from "../network/NetworkManager";

export class TrustedAuthority {
    private static TrustedHostList: Array<string> = [];

    /**
     * 
     * @param validateAuthority 
     * @param knownAuthorities 
     */
    public static setTrustedAuthoritiesFromConfig(knownAuthorities: Array<string>){
        if (!this.getTrustedHostList().length){
            knownAuthorities.forEach(function(authority) {
                TrustedAuthority.TrustedHostList.push(authority.toLowerCase());
            });
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
        metadata.forEach(function(entry: any){
            const authorities: Array<string> = entry.aliases;
            authorities.forEach(function(authority: string) {
                TrustedAuthority.TrustedHostList.push(authority.toLowerCase());
            });
        });
    } 

    public static getTrustedHostList(): Array<string> {
        return this.TrustedHostList;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param host 
     */
    public static IsInTrustedHostList(host: string): boolean {
        return this.TrustedHostList.indexOf(host.toLowerCase()) > -1;
    }
}
