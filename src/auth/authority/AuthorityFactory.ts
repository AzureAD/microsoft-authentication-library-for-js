/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority } from "./B2cAuthority";
import { AuthorityType } from "./AuthorityType";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { ClientAuthError } from "../../error/ClientAuthError";
import { INetworkModule } from "../../network/INetworkModule";
import { StringUtils } from "../../utils/StringUtils";
import { UrlString } from "../../url/UrlString";

export const B2CTrustedHostList: string[] = [];

export class AuthorityFactory {  
    /**
     * Use when Authority is B2C to provide list of trusted/allowed domains.
     */
    public static setKnownAuthorities(knownAuthorities: Array<string>): void {
        if (!Object.keys(B2CTrustedHostList).length){
            knownAuthorities.forEach(function(authority){
                B2CTrustedHostList.push(authority);
            });
        }
    }

    /**
     * Parse the url and determine the type of authority
     */
    private static detectAuthorityFromUrl(authorityString: string): AuthorityType {
        const authorityUrl = new UrlString(authorityString);
        const components = authorityUrl.getUrlComponents();
        const pathSegments = components.PathSegments;

        if (pathSegments[0] === "adfs")
            return AuthorityType.Adfs;
        else if (Object.keys(B2CTrustedHostList).length)
            return AuthorityType.B2C;

        // defaults to Aad
        return AuthorityType.Aad;
    }

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (eg aad, b2c)
     */
    public static createInstance(authorityUrl: string, networkInterface: INetworkModule): Authority {
        // Throw error if authority url is empty
        if (StringUtils.isEmpty(authorityUrl)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }

        const type = AuthorityFactory.detectAuthorityFromUrl(authorityUrl);
        // Depending on above detection, create the right type.
        switch (type) {
            case AuthorityType.Aad:
                return new AadAuthority(authorityUrl, networkInterface);
            case AuthorityType.B2C:
                return new B2cAuthority(authorityUrl, networkInterface);
            // TODO: Support ADFS here in a later PR
            default:
                throw ClientAuthError.createInvalidAuthorityTypeError(`Given Url: ${authorityUrl}`);
        }
    }
}
