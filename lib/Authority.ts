namespace MSAL {
    enum AuthorityType {
        Aad,
        Adfs,
        B2C
    }

    export abstract class Authority {
        protected constructor(authority: string, validateAuthority: boolean) {
            this.IsValidationEnabled = validateAuthority;
            this.CanonicalAuthority = authority;
        }

        public IsValidationEnabled: boolean;

        public get Tenant(): string {
            // TODO: (shivb) extract the tenant from the Canonical authority
            throw "not implemented";
        }

        /*
        * A URL that is the authority set by the developer
        */
        public CanonicalAuthority: string;

        /*
        * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
        */
        protected get DefaultOpenIdConfigurationEndpoint(): string {
            return `${this.CanonicalAuthority}v2.0/.well-known/openid-configuration`;
        }

        /*
        * Given a string, validate that it is of the form https://domain/path
        * @Returns: true if input is a valid uri
        */
        private static ValidateAsUri(uri: string): boolean {
            throw "not implemented";
        }

        /*
        * Parse the url and determine the type of authority
        */
        private static DetectAuthorityFromUrl(url: string) {
        }

        /*
        * Create an authority object of the correct type based on the url
        * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
        */
        public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
            // this.ValidateAsUri(authorityUrl);
            // this.DetectAuthorityFromUrl(authorityUrl);
            // Depending on above detection, create the right type.
            throw "not implemented";
        }

        /*
        * Calls the OIDC endpoint and returns the response
        */
        private DiscoverEndpoints(openIdConfigurationEndpoint: string): Promise<ITenantDiscoveryResponse> {
            return this.sendRequestAsync("GET", openIdConfigurationEndpoint, /*enableCaching:*/ true)
                .then((response: any) => {
                    // TODO: (shivb) validate that the following properties are not null or empty
                    return <ITenantDiscoveryResponse>{
                        AuthorizationEndpoint: response.authorization_endpoint,
                        TokenEndpoint: response.token_endpoint,
                        Issuer: response.issuer
                    }
                })
        }

        /*
        * XHR client for JSON endpoints
        * https://www.npmjs.com/package/async-promise
        */
        private sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any> {
            return new Promise<string>((resolve, reject) => {
                var xhr = new XMLHttpRequest();

                if (enableCaching) {
                    // TODO: add headers that cache this request
                    xhr.setRequestHeader("Cache-Control", "Public");
                }

                xhr.open(method, url,/*async:*/ true);
                xhr.onload = (ev) => {
                    if (xhr.status < 200 || xhr.status >= 300) {
                        reject(xhr.responseText);
                    }

                    var jsonResponse = JSON.parse(xhr.responseText);
                    resolve(jsonResponse);
                }

                xhr.onerror = (ev) => {
                    reject(xhr.status);
                };

                if (method == 'GET') {
                    xhr.send();
                }
                else {
                    throw "not implemented";
                }
            });
        }

        /*
        * Returns a promise.
        * Checks to see if the authority is in the cache
        * Discover endpoints via openid-configuration
        * If successful, caches the endpoint for later use in OIDC
        */
        public ResolveEndpointsAsync(): Promise<Authority> {
            let openIdConfigurationEndpoint = "";
            return this.GetOpenIdConfigurationEndpointAsync().then(openIdConfigurationEndpointResponse => {
                openIdConfigurationEndpoint = openIdConfigurationEndpointResponse;
                return this.DiscoverEndpoints(openIdConfigurationEndpoint);
            }).then((tenantDiscoveryResponse: ITenantDiscoveryResponse) => {
                // TODO: (shivb) replace {tenant} with this.Tenant
                return this;
            });
        }

        /*
        * Returns a promise with the TenantDiscoveryEndpoint
        */
        public abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
    }
}