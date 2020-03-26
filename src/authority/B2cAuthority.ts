/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { B2CTrustedHostList } from "./AuthorityFactory";
import { INetworkModule } from "../network/INetworkModule";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { AuthorityType } from './AuthorityType';

/**
 * The B2cAuthority class extends the Authority class and adds functionality specific to the Azure AD OAuth Authority.
 */
export class B2cAuthority extends Authority {
    /**
     * Set authority type to B2C
     */
    public get authorityType(): AuthorityType {
        return AuthorityType.B2C;
    }
       public constructor(authority: string, networkInterface: INetworkModule) {
        super(authority, networkInterface);
    }

    /**
     * Returns a promise with the TenantDiscoveryEndpoint
     */
    public async getOpenIdConfigurationEndpointAsync(): Promise<string> {
        if (this.isInTrustedHostList(this.canonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.defaultOpenIdConfigurationEndpoint;
        }

        throw ClientConfigurationError.createUnsupportedAuthorityValidationError();
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    public isInTrustedHostList(host: string): boolean {
        if (!Object.keys(B2CTrustedHostList).length) {
            throw ClientConfigurationError.createKnownAuthoritiesNotSetError();
        }

        return B2CTrustedHostList[host.toLowerCase()];
    }
}
