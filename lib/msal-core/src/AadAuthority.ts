// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Authority, AuthorityType } from "./Authority";
import { XhrClient } from "./XHRClient";
import { AADTrustedHostList } from "./Constants";

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
  public GetOpenIdConfigurationEndpointAsync(): Promise<string> {
      const resultPromise: Promise<string> = new Promise<string>((resolve, reject) =>
      resolve(this.DefaultOpenIdConfigurationEndpoint));

    if (!this.IsValidationEnabled) {
      return resultPromise;
    }

    let host: string = this.CanonicalAuthorityUrlComponents.HostNameAndPort;
    if (this.IsInTrustedHostList(host)) {
      return resultPromise;
    }

    let client: XhrClient = new XhrClient();

    return client.sendRequestAsync(this.AadInstanceDiscoveryEndpointUrl, "GET", true)
      .then((response) => {
        return response.tenant_discovery_endpoint;
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
