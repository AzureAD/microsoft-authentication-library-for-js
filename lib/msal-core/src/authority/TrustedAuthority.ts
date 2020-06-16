import TelemetryManager from "../telemetry/TelemetryManager";
import { XhrClient, XhrResponse } from "../XHRClient";
import HttpEvent from "../telemetry/HttpEvent";
import { AAD_INSTANCE_DISCOVERY_ENDPOINT, NetworkRequestType } from "../utils/Constants";

export class TrustedAuthority {
    private static TrustedHostList: Array<string> = [];

    /**
     * 
     * @param validateAuthority 
     * @param knownAuthorities 
     */
    public static setTrustedAuthoritiesFromConfig(validateAuthority: boolean, knownAuthorities: Array<string>){
        if (validateAuthority && !this.getTrustedHostList().length){
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
    private static async getAliases(telemetryManager: TelemetryManager, correlationId?: string): Promise<Array<any>> {
        const client: XhrClient = new XhrClient();

        const httpMethod = NetworkRequestType.GET;
        const httpEvent: HttpEvent = telemetryManager.createAndStartHttpEvent(correlationId, httpMethod, AAD_INSTANCE_DISCOVERY_ENDPOINT, "getAliases");
        return client.sendRequestAsync(AAD_INSTANCE_DISCOVERY_ENDPOINT, httpMethod, true)
            .then((response: XhrResponse) => {
                httpEvent.httpResponseStatus = response.statusCode;
                telemetryManager.stopEvent(httpEvent);
                return response.body.metadata;
            })
            .catch(err => {
                httpEvent.serverErrorCode = err;
                telemetryManager.stopEvent(httpEvent);
                throw err;
            });
    }

    /**
     * 
     * @param telemetryManager 
     * @param correlationId 
     */
    public static async setTrustedAuthoritiesFromNetwork(telemetryManager: TelemetryManager, correlationId?: string): Promise<void> {
        const metadata = await this.getAliases(telemetryManager, correlationId);
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
