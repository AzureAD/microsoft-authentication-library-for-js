namespace Msal {

    /**
    * @hidden
    */
    export enum AuthorityType {
        Aad,
        Adfs,
        B2C
    }

    /**
    * @hidden
    */
    export abstract class Authority {
        protected constructor(authority: string, validateAuthority: boolean) {
            this.IsValidationEnabled = validateAuthority;
            this.CanonicalAuthority = authority;

            this.validateAsUri();
        }

        public abstract get AuthorityType(): AuthorityType;

        public IsValidationEnabled: boolean;

        public get Tenant(): string {
            return this.CanonicalAuthorityUrlComponents.PathSegments[0];
        }

        private tenantDiscoveryResponse: ITenantDiscoveryResponse;

        public get AuthorizationEndpoint(): string {
            this.validateResolved();
            return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.Tenant);
        }

        public get EndSessionEndpoint(): string {
            this.validateResolved();
            return this.tenantDiscoveryResponse.EndSessionEndpoint.replace("{tenant}", this.Tenant);
        }

        public get SelfSignedJwtAudience(): string {
            this.validateResolved();
            return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.Tenant);
        }

        private validateResolved() {
            if (!this.tenantDiscoveryResponse) {
                throw "Please call ResolveEndpointsAsync first";
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

        public get CanonicalAuthorityUrlComponents(): IUri {
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
        private validateAsUri() {
            let components;
            try {
                components = this.CanonicalAuthorityUrlComponents;
            }
            catch (e) {
                throw ErrorMessage.invalidAuthorityType;
            }

            if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
                throw ErrorMessage.authorityUriInsecure;
            };

            if (!components.PathSegments || components.PathSegments.length < 1) {
                throw ErrorMessage.authorityUriInvalidPath;
            }
        }

        /*
        * Parse the url and determine the type of authority
        */
        private static DetectAuthorityFromUrl(authorityUrl: string): AuthorityType {
            authorityUrl = Utils.CanonicalizeUri(authorityUrl);
            let components = Utils.GetUrlComponents(authorityUrl);
            let pathSegments = components.PathSegments;

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
            let type = Authority.DetectAuthorityFromUrl(authorityUrl);
            // Depending on above detection, create the right type.
            switch (type) {
                case AuthorityType.B2C:
                    return new B2cAuthority(authorityUrl, validateAuthority);
                case AuthorityType.Aad:
                    return new AadAuthority(authorityUrl, validateAuthority);
                default:
                    throw ErrorMessage.invalidAuthorityType;
            }
        }

        /*
        * Calls the OIDC endpoint and returns the response
        */
        private DiscoverEndpoints(openIdConfigurationEndpoint: string): Promise<ITenantDiscoveryResponse> {
            let client = new XhrClient();
            return client.sendRequestAsync(openIdConfigurationEndpoint, "GET",/*enableCaching:*/ true)
                .then((response: any) => {
                    return <ITenantDiscoveryResponse>{
                        AuthorizationEndpoint: response.authorization_endpoint,
                        EndSessionEndpoint: response.end_session_endpoint,
                        Issuer: response.issuer
                    }
                })
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