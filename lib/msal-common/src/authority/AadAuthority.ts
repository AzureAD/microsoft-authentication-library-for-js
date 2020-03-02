/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { AuthorityType } from "./AuthorityType";
import { AADTrustedHostList, Constants } from "./../utils/Constants";
import { INetworkModule } from "./../network/INetworkModule";

/**
 * The AadAuthority class extends the Authority class and adds functionality specific to the Azure AD OAuth Authority.
 */
export class AadAuthority extends Authority {
    // Set authority type to AAD
    public get authorityType(): AuthorityType {
        return AuthorityType.Aad;
    }

    // Default AAD Instance Discovery Endpoint
    private get aadInstanceDiscoveryEndpointUrl(): string {
        return `${Constants.AAD_INSTANCE_DISCOVERY_ENDPT}?api-version=1.0&authorization_endpoint=${this.canonicalAuthority}oauth2/v2.0/authorize`;
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

        // for custom domains in AAD where we query the service for the Instance discovery
        const response = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(this.aadInstanceDiscoveryEndpointUrl);
        return response.tenant_discovery_endpoint;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    private isInTrustedHostList(host: string): boolean {
        return AADTrustedHostList.includes(host);
    }
}
