/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority, AuthorityType } from "./Authority";
import { AADTrustedHostList } from "../../utils/Constants";
import { INetworkModule } from "../../app/INetworkModule";

/**
 * @hidden
 */
export class AadAuthority extends Authority {
    public get authorityType(): AuthorityType {
        return AuthorityType.Aad;
    }

    public get isValidationEnabled(): boolean {
        // Hardcoded to true for now - will change depending on requirements
        return true;
    }

    private static readonly aadInstanceDiscoveryEndpoint: string = "https://login.microsoftonline.com/common/discovery/instance";

    private get aadInstanceDiscoveryEndpointUrl(): string {
        return `${AadAuthority.aadInstanceDiscoveryEndpoint}?api-version=1.0&authorization_endpoint=${this.canonicalAuthority}oauth2/v2.0/authorize`;
    }

    public constructor(authority: string, networkInterface: INetworkModule) {
        super(authority, networkInterface);
    }

    /**
     * Returns a promise which resolves to the OIDC endpoint
     * Only responds with the endpoint
     */

    public async getOpenIdConfigurationAsync(): Promise<string> {
        if (!this.isValidationEnabled || this.isInTrustedHostList(this.canonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.defaultOpenIdConfigurationEndpoint;
        }

        // for custom domains in AAD where we query the service for the Instance discovery
        const response = await this.networkInterface.sendRequestAsync(this.aadInstanceDiscoveryEndpointUrl, "GET", true);
        return response.tenant_discovery_endpoint;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    public isInTrustedHostList(host: string): boolean {
        return AADTrustedHostList[host.toLowerCase()];
    }
}
