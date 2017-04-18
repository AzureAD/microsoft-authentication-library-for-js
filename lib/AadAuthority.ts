namespace MSAL {
    export class AadAuthority extends Authority {
        protected constructor(authority: string, validateAuthority: boolean) {
            super(authority, validateAuthority);
        }

        private static TrustedHostList: any = {
            "login.windows.net": "login.windows.net",
            "login.chinacloudapi.cn": "login.chinacloudapi.cn",
            "login.cloudgovapi.us": "login.cloudgovapi.us",
            "login.microsoftonline.com": "login.microsoftonline.com",
            "login.microsoftonline.de": "login.microsoftonline.de"
        };

        /*
        * Returns a promise.
        * Checks to see if the authority is in the cache
        * Discover endpoints via openid-configuration
        * If successful, caches the endpoint for later use in OIDC
        */
        public ResolveEndpointsAsync() {
            //
        }

        /*
        * Returns a promise with the TenantDiscoveryEndpoint
        */
        public GetOpenIdConfigurationEndpointAsync(): string {
            throw "not implemented";
        }

        /*
        * Checks to see if the host is in a list of trusted hosts
        */
        public IsInTrustedHostList(host: string): boolean {
            throw "not implemented";
        }
    }
}