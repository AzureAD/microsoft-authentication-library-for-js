/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { AadAuthority } from "./AadAuthority";
import { AuthorityType } from "./AuthorityType";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "./../error/ClientAuthError";
import { INetworkModule } from "./../network/INetworkModule";
import { StringUtils } from "./../utils/StringUtils";
import { UrlString } from "./../url/UrlString";

export class AuthorityFactory {

    /**
     * Parse the url and determine the type of authority
     */
    private static detectAuthorityFromUrl(authorityString: string): AuthorityType {
        const authorityUrl = new UrlString(authorityString);
        const components = authorityUrl.getUrlComponents();
        const pathSegments = components.PathSegments;
        switch (pathSegments[0]) {
            case "tfp":
                // tfp denotes a b2c url
                return AuthorityType.B2C;
            default:
                // default authority is always AAD
                return AuthorityType.Aad;
        }
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
            default:
                throw ClientAuthError.createInvalidAuthorityTypeError(`Given Url: ${authorityUrl}`);
        }
    }
}
