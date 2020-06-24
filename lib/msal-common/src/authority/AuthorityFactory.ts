/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { AadAuthority } from "./AadAuthority";
import { B2cAuthority } from "./B2cAuthority";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { ClientAuthError } from "./../error/ClientAuthError";
import { INetworkModule } from "./../network/INetworkModule";
import { StringUtils } from "./../utils/StringUtils";
import { UrlString } from "./../url/UrlString";
import { Constants } from "../utils/Constants";
import { AdfsAuthority } from "./AdfsAuthority";

export class AuthorityFactory {

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
     * 
     * Also performs endpoint discovery.
     * 
     * @param defaultAuthority 
     * @param networkClient 
     * @param authorityUri 
     * @param adfsDisabled 
     */
    static async createDiscoveredInstance(authorityUri: string, networkClient: INetworkModule): Promise<Authority> {
        // Initialize authority and perform discovery endpoint check.
        const acquireTokenAuthority: Authority = AuthorityFactory.createInstance(authorityUri, networkClient);

        if (acquireTokenAuthority.discoveryComplete()) {
            return acquireTokenAuthority;
        }

        try {
            await acquireTokenAuthority.resolveEndpointsAsync();
            return acquireTokenAuthority;
        } catch (e) {
            throw ClientAuthError.createEndpointDiscoveryIncompleteError(e);
        }
    }

    /**
     * Create an authority object of the correct type based on the url
     * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
     * 
     * Does not perform endpoint discovery.
     * 
     * @param authorityUrl 
     * @param networkInterface 
     */
    static createInstance(authorityUrl: string, networkInterface: INetworkModule): Authority {
        // Throw error if authority url is empty
        if (StringUtils.isEmpty(authorityUrl)) {
            throw ClientConfigurationError.createUrlEmptyError();
        }

        return AuthorityFactory.detectAuthorityFromUrl(authorityUrl, networkInterface);
    }

    /**
     * Parse the url and determine the type of authority.
     * @param authorityString 
     * @param networkInterface 
     */
    private static detectAuthorityFromUrl(authorityString: string, networkInterface: INetworkModule): Authority {
        const authorityUrl: UrlString = new UrlString(authorityString);
        const components = authorityUrl.getUrlComponents();
        const pathSegments = components.PathSegments;

        if (pathSegments.length && pathSegments[0].toLowerCase() === Constants.ADFS) {
            return new AdfsAuthority(authorityString, networkInterface);
        } else if (B2cAuthority.B2CTrustedHostList.length) {
            return new B2cAuthority(authorityString, networkInterface);
        }
        // defaults to Aad
        return new AadAuthority(authorityString, networkInterface);
    }
}
