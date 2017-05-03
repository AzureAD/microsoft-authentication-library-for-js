/// <reference path="Authority.ts" /> // this is needed to work around error TS2690

namespace Msal {

    /**
    * @hidden
    */
    export class AadAuthority extends Authority {
        private static readonly AadInstanceDiscoveryEndpoint: string = "https://login.microsoftonline.com/common/discovery/instance";

        private get AadInstanceDiscoveryEndpointUrl(): string {
            return `${AadAuthority.AadInstanceDiscoveryEndpoint}?api-version=1.0&authorization_endpoint=${this.CanonicalAuthority}oauth2/v2.0/authorize`;
        }

        public constructor(authority: string, validateAuthority: boolean) {
            super(authority, validateAuthority);
        }

        public get AuthorityType(): AuthorityType {
            return AuthorityType.Aad;
        }

        private static readonly TrustedHostList: any = {
            "login.windows.net": "login.windows.net",
            "login.chinacloudapi.cn": "login.chinacloudapi.cn",
            "login.cloudgovapi.us": "login.cloudgovapi.us",
            "login.microsoftonline.com": "login.microsoftonline.com",
            "login.microsoftonline.de": "login.microsoftonline.de"
        };

        /*
        * Returns a promise which resolves to the OIDC endpoint
        * Only responds with the endpoint
        */
        public GetOpenIdConfigurationEndpointAsync(): Promise<string> {
            var resultPromise = new Promise<string>((resolve, reject) =>
                resolve(this.DefaultOpenIdConfigurationEndpoint));

            if (!this.IsValidationEnabled) {
                return resultPromise;
            }

            let host = this.CanonicalAuthorityUrlComponents.HostNameAndPort;
            if (this.IsInTrustedHostList(host)) {
                return resultPromise;
            }

            let client = new XhrClient();

            return client.sendRequestAsync(this.AadInstanceDiscoveryEndpointUrl, "GET", true)
                .then((response) => {
                    return response.tenant_discovery_endpoint;
                });
        }

        /*
        * Checks to see if the host is in a list of trusted hosts
        * @param {string} The host to look up
        */
        public IsInTrustedHostList(host: string): boolean {
            return AadAuthority.TrustedHostList[host.toLowerCase()];
        }
    }
}