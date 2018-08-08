/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import { Authority, AuthorityType } from "./Authority";
import { XhrClient } from "./XHRClient";

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

  private static readonly TrustedHostList: any = {
    "login.windows.net": "login.windows.net",
    "login.chinacloudapi.cn": "login.chinacloudapi.cn",
    "login.cloudgovapi.us": "login.cloudgovapi.us",
    "login.microsoftonline.com": "login.microsoftonline.com",
    "login.microsoftonline.de": "login.microsoftonline.de",
    "login.microsoftonline.us": "login.microsoftonline.us"
  };

  /**
   * Returns a promise which resolves to the OIDC endpoint
   * Only responds with the endpoint
   */
  public GetOpenIdConfigurationEndpointAsync(): Promise<string> {
      var resultPromise: Promise<string> = new Promise<string>((resolve, reject) =>
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
    return AadAuthority.TrustedHostList[host.toLowerCase()];
  }
}
