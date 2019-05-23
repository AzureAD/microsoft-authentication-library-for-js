// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
import { Utils } from "./Utils";
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority } from "./B2cAuthority";
import { Authority, AuthorityType } from "./Authority";
import { ClientConfigurationErrorMessage } from "./error/ClientConfigurationError";

export class AuthorityFactory {
    /**
    * Parse the url and determine the type of authority
    */
    private static DetectAuthorityFromUrl(authorityUrl: string): AuthorityType {
        authorityUrl = Utils.CanonicalizeUri(authorityUrl);
        const components = Utils.GetUrlComponents(authorityUrl);
        const pathSegments = components.PathSegments;
        switch (pathSegments[0]) {
            case "tfp":
                return AuthorityType.B2C;
            case "adfs":
                return AuthorityType.Adfs;
            default:
                return AuthorityType.Aad;
        }
    }

    /**
    * Create an authority object of the correct type based on the url
    * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
    */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
        if (Utils.isEmpty(authorityUrl)) {
            return null;
        }
        const type = AuthorityFactory.DetectAuthorityFromUrl(authorityUrl);
        // Depending on above detection, create the right type.
        switch (type) {
            case AuthorityType.B2C:
                return new B2cAuthority(authorityUrl, validateAuthority);
            case AuthorityType.Aad:
                return new AadAuthority(authorityUrl, validateAuthority);
            default:
                throw ClientConfigurationErrorMessage.invalidAuthorityType;
        }
    }

}
