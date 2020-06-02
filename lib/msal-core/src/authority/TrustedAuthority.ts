import TelemetryManager from "../telemetry/TelemetryManager";
import { XhrClient, XhrResponse } from "../XHRClient";
import HttpEvent from "../telemetry/HttpEvent";
import { AAD_INSTANCE_DISCOVERY_ENDPOINT } from "../utils/Constants";

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
    public static setTrustedAuthoritiesFromNetwork(validateAuthority: boolean, telemetryManager: TelemetryManager, correlationId?: string): Promise<void> {
        if (!validateAuthority || this.getTrustedHostList().length > 0) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            const client: XhrClient = new XhrClient();

            const httpMethod = "GET";
            const httpEvent: HttpEvent = telemetryManager.createAndStartHttpEvent(correlationId, httpMethod, AAD_INSTANCE_DISCOVERY_ENDPOINT, "getAliases");
            client.sendRequestAsync(AAD_INSTANCE_DISCOVERY_ENDPOINT, httpMethod, true)
                .then((response: XhrResponse) => {
                    httpEvent.httpResponseStatus = response.statusCode;
                    telemetryManager.stopEvent(httpEvent);

                    response.body.metadata.forEach(function(entry: any){
                        const authorities: Array<string> = entry.aliases;
                        authorities.forEach(function(authority: string) {
                            TrustedAuthority.TrustedHostList.push(authority.toLowerCase());
                        });
                    });

                    resolve();
                })
                .catch(err => {
                    httpEvent.serverErrorCode = err;
                    telemetryManager.stopEvent(httpEvent);
                    reject(err);
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
