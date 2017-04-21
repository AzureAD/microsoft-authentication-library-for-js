namespace Msal {
    export class B2cAuthority extends AadAuthority {
        public constructor(authority: string, validateAuthority: boolean) {
            super(authority, validateAuthority);
            let urlComponents = Utils.GetUrlComponents(authority);

            let pathSegments = urlComponents.PathSegments;
            if (pathSegments.length < 3) {
                throw "B2cAuthorityUriInvalidPath" // TODO: (shivb) throw formal exception
            }

            this.CanonicalAuthority = `https://${urlComponents.HostNameAndPort}/${pathSegments[0]}/${pathSegments[1]}/${pathSegments[2]}/`;
        }

        public get AuthorityType(): AuthorityType {
            return AuthorityType.B2C;
        }

        /*
        * Returns a promise with the TenantDiscoveryEndpoint
        */
        public GetOpenIdConfigurationEndpointAsync(): Promise<string> {
            var resultPromise = new Promise<string>((resolve, reject) =>
                resolve(this.DefaultOpenIdConfigurationEndpoint));

            if (!this.IsValidationEnabled) {
                return resultPromise;
            }

            if (this.IsInTrustedHostList(this.CanonicalAuthority)) {
                return resultPromise;
            }

            return new Promise<string>((resolve, reject) =>
                reject("UnsupportedAuthorityValidation")); // TODO: (shivb) throw formal exception
        }
    }
}