/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { AuthorityType } from "./AuthorityType";
import { ClientConfigurationError } from "../../error/ClientConfigurationError";
import { INetworkModule } from "../../network/INetworkModule";

export const B2CTrustedHostList: string[] = [];

/**
 * The AadAuthority class extends the Authority class and adds functionality specific to the Azure AD OAuth Authority.
 */
export class B2cAuthority extends Authority {
    // Set authority type to AAD
    public get authorityType(): AuthorityType {
        return AuthorityType.B2C;
    }

    public constructor(authority: string, networkInterface: INetworkModule) {
        super(authority, networkInterface);
    }

    /**
     * Returns a promise which resolves to the OIDC endpoint
     * Only responds with the endpoint
     */
    public async getOpenIdConfigurationEndpointAsync(): Promise<string> {
        if (this.isInTrustedHostList(this.canonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.defaultOpenIdConfigurationEndpoint;
        }

        throw ClientConfigurationError.createUntrustedAuthorityError();
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    private isInTrustedHostList(host: string): boolean {
        return B2CTrustedHostList.includes(host);
    }
}
