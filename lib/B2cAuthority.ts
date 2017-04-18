namespace MSAL {
    export class B2cAuthority extends AadAuthority {
        private constructor(authority: string, validateAuthority: boolean) {
            super(authority, validateAuthority);
        }

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
    }
}