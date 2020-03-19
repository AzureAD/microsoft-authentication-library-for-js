/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority, AuthorityType } from "./Authority";
import { XhrClient } from "../XHRClient";
import { AADTrustedHostList } from "../utils/Constants";
import HttpEvent from "../telemetry/HttpEvent";
import TelemetryManager from "../telemetry/TelemetryManager";

/**
 * @hidden
 */
export class AadAuthority extends Authority {
    private static readonly AadInstanceDiscoveryEndpoint: string = "https://login.microsoftonline.com/common/discovery/instance";

    private get AadInstanceDiscoveryEndpointUrl(): string {
        return `${AadAuthority.AadInstanceDiscoveryEndpoint}?api-version=1.0&authorization_endpoint=${this.CanonicalAuthority}oauth2/v2.0/authorize`;
    }

    public constructor(authority: string, validateAuthority: boolean) {
        super(authority, validateAuthority);
    }

    public get AuthorityType(): AuthorityType {
        return AuthorityType.Aad;
    }

    /**
     * Returns a promise which resolves to the OIDC endpoint
     * Only responds with the endpoint
     */
    public async GetOpenIdConfigurationEndpointAsync(telemetryManager?: TelemetryManager, correlationId?: string): Promise<string> {
        if (!this.IsValidationEnabled || this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
            return this.DefaultOpenIdConfigurationEndpoint;
        }

        // for custom domains in AAD where we query the service for the Instance discovery
        const client: XhrClient = new XhrClient();

        const httpMethod = "GET";
        const httpEvent = new HttpEvent(correlationId);
        httpEvent.url = this.AadInstanceDiscoveryEndpointUrl;
        httpEvent.httpMethod = httpMethod;
        telemetryManager.startEvent(httpEvent);
        return client.sendRequestAsync(this.AadInstanceDiscoveryEndpointUrl, httpMethod, true)
            .then((response) => {
                httpEvent.httpResponseStatus = response.client.status;
                return response.responseBody.tenant_discovery_endpoint;
            })
            .catch(err => {
                httpEvent.serverErrorCode = err;
                throw err;
            })
            .finally(() => {
                telemetryManager.stopEvent(httpEvent);
            });
    }

    /**
     * Checks to see if the host is in a list of trusted hosts
     * @param {string} The host to look up
     */
    public IsInTrustedHostList(host: string): boolean {
        return AADTrustedHostList[host.toLowerCase()];
    }
}
