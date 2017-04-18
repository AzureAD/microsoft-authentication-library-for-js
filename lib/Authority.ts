namespace MSAL {
    export enum AuthorityType {
        Aad,
        Adfs,
        B2C
    }

    export abstract class Authority {
        protected constructor(authority: string, validateAuthority: boolean) {
            this.IsValidationEnabled = validateAuthority;
            this.CanonicalAuthority = authority;
        }

        public abstract get AuthorityType(): AuthorityType;

        public IsValidationEnabled: boolean;

        public get Tenant(): string {
            let path = this.CanonicalAuthorityUrlComponents.AbsolutePath;
            return path.substr(0, path.indexOf("/"));
        }

        private tenantDiscoveryResponse: ITenantDiscoveryResponse;

        public get Host(): string {
            return this.CanonicalAuthorityUrlComponents.HostNameAndPort;
        }
        public get AuthorizationEndpoint(): string {
            this.validateResolved();
            return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.Tenant);
        }

        public get TokenEndpoint(): string {
            this.validateResolved();
            return this.tenantDiscoveryResponse.TokenEndpoint.replace("{tenant}", this.Tenant);
        }

        public get SelfSignedJwtAudience(): string {
            this.validateResolved();
            return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.Tenant);
        }

        private validateResolved() {
            if (!this.tenantDiscoveryResponse) {
                throw "Please call ResolveEndpointsAsync first"; // TODO: (shivb) formal exception
            }
        }

        /*
        * A URL that is the authority set by the developer
        */
        public get CanonicalAuthority(): string {
            return this.canonicalAuthority;
        };

        public set CanonicalAuthority(url: string) {
            this.canonicalAuthority = Utils.CanonicalizeUri(url);
            this.canonicalAuthorityUrlComponents = null;
        }

        private canonicalAuthority: string;
        private canonicalAuthorityUrlComponents: IUri;

        protected get CanonicalAuthorityUrlComponents(): IUri {
            if (!this.canonicalAuthorityUrlComponents) {
                this.canonicalAuthorityUrlComponents = Utils.GetUrlComponents(this.CanonicalAuthority);
            }

            return this.canonicalAuthorityUrlComponents;
        }

        /*
        * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
        */
        protected get DefaultOpenIdConfigurationEndpoint(): string {
            return `${this.CanonicalAuthority}v2.0/.well-known/openid-configuration`;
        }

        /*
        * Given a string, validate that it is of the form https://domain/path
        */
        private static validateAsUri(uri: string) {
            // throw "not implemented"; // TODO: (shivb) complete implementation
        }

        /*
        * Parse the url and determine the type of authority
        */
        private static DetectAuthorityFromUrl(authorityUrl: string): AuthorityType {
            authorityUrl = Utils.CanonicalizeUri(authorityUrl);
            let components = Utils.GetUrlComponents(authorityUrl);
            let pathSegments = components.AbsolutePath.split("/");

            switch (pathSegments[0]) {
                case "tfp":
                    return AuthorityType.B2C;
                case "adfs":
                    return AuthorityType.Adfs;
                default:
                    return AuthorityType.Aad;
            }
        }

        /*
        * Create an authority object of the correct type based on the url
        * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
        */
        public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
            Authority.validateAsUri(authorityUrl);

            let type = Authority.DetectAuthorityFromUrl(authorityUrl);
            // Depending on above detection, create the right type.
            switch (type) {
                case AuthorityType.B2C:
                    return new B2cAuthority(authorityUrl, validateAuthority);
                case AuthorityType.Aad:
                    return new AadAuthority(authorityUrl, validateAuthority);
                default:
                    throw "InvalidAuthorityType"; // TODO: (shivb) throw format exception
            }
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
        protected sendRequestAsync(url: string, method: string, enableCaching?: boolean): Promise<any> {
            return new Promise<string>((resolve, reject) => {
                var xhr = new XMLHttpRequest();

                if (enableCaching) {
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
                this.tenantDiscoveryResponse = tenantDiscoveryResponse;
                return this;
            });
        }

        /*
        * Returns a promise with the TenantDiscoveryEndpoint
        */
        public abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
    }
}