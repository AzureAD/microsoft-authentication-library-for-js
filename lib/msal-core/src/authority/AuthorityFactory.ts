/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @hidden
 */
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority, B2CTrustedHostList } from "./B2cAuthority";
import { Authority, AuthorityType } from "./Authority";
import { StringUtils } from "../utils/StringUtils";
import { UrlUtils } from "../utils/UrlUtils";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

export class AuthorityFactory {
    /**
     * Use when Authority is B2C and validateAuthority is set to True to provide list of allowed domains.
     */
    public static setKnownAuthorities(validateAuthority: boolean, knownAuthorities: Array<string>): void {
        if (validateAuthority && !Object.keys(B2CTrustedHostList).length){
            knownAuthorities.forEach(function(authority){
                B2CTrustedHostList[authority] = authority;
            });
        }
    }

    /**
     * Parse the url and determine the type of authority
     */
    private static detectAuthorityFromUrl(authorityUrl: string): AuthorityType {
        authorityUrl = UrlUtils.CanonicalizeUri(authorityUrl);
        const components = UrlUtils.GetUrlComponents(authorityUrl);
        const pathSegments = components.PathSegments;

        if (pathSegments[0] === "adfs") {
            return AuthorityType.Adfs;
        }
        else if (Object.keys(B2CTrustedHostList).length) {
            return AuthorityType.B2C;
        }

        // Defaults to Aad
        return AuthorityType.Aad;
    }	    

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static CreateInstance(authorityUrl: string, validateAuthority: boolean): Authority {
        if (StringUtils.isEmpty(authorityUrl)) {
            return null;
        }
        const type = AuthorityFactory.detectAuthorityFromUrl(authorityUrl);
        // Depending on above detection, create the right type.
        switch (type) {
            case AuthorityType.B2C:
                return new B2cAuthority(authorityUrl, validateAuthority);
            case AuthorityType.Aad:
                return new AadAuthority(authorityUrl, validateAuthority);
            default:
                throw ClientConfigurationError.createInvalidAuthorityTypeError();
        }
    }

}
