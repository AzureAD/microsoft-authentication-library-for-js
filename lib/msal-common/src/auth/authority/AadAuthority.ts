/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Authority } from "./Authority";
import { OpenIdConfigResponse } from "./OpenIdConfigResponse";
import { AuthorityType } from "./AuthorityType";
import { AADTrustedHostList } from "../../utils/Constants";
import { INetworkModule } from "../../network/INetworkModule";

/**
 * The AadAuthority class extends the Authority class and adds functionality specific to the Azure AD OAuth Authority.
 */
export class AadAuthority extends Authority {
    // Set authority type to AAD
    public get authorityType(): AuthorityType {
        return AuthorityType.Aad;
    }

    public get isValidationEnabled(): boolean {
        // Hardcoded to true for now - may change depending on requirements
        return true;
    }

    // Default AAD Instance Discovery Endpoint
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
        const response = await this.networkInterface.sendGetRequestAsync<OpenIdConfigResponse>(this.aadInstanceDiscoveryEndpointUrl);
        return response.tenant_discovery_endpoint;
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    public isInTrustedHostList(host: string): boolean {
        return AADTrustedHostList.includes(host);
    }
}
