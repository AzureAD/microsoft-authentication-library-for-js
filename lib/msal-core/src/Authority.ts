import { IUri } from "./IUri";
import { Utils } from "./Utils";
import { ITenantDiscoveryResponse } from "./ITenantDiscoveryResponse";
import { ErrorMessage } from "./ErrorMessage";
import { XhrClient } from "./XHRClient";

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


/*
 * @hidden
 */
export enum AuthorityType {
  Aad,
  Adfs,
  B2C
}

/*
 * @hidden
 */
export abstract class Authority {
  constructor(authority: string, validateAuthority: boolean) {
    this.IsValidationEnabled = validateAuthority;
    this.CanonicalAuthority = authority;

    this.validateAsUri();
  }

  public abstract get AuthorityType(): AuthorityType;

  public IsValidationEnabled: boolean;

  public get Tenant(): string {
    return this.CanonicalAuthorityUrlComponents.PathSegments[0];
  }

  private tenantDiscoveryResponse: ITenantDiscoveryResponse;

  public get AuthorizationEndpoint(): string {
    this.validateResolved();
    return this.tenantDiscoveryResponse.AuthorizationEndpoint.replace("{tenant}", this.Tenant);
  }

  public get EndSessionEndpoint(): string {
    this.validateResolved();
    return this.tenantDiscoveryResponse.EndSessionEndpoint.replace("{tenant}", this.Tenant);
  }

  public get SelfSignedJwtAudience(): string {
    this.validateResolved();
    return this.tenantDiscoveryResponse.Issuer.replace("{tenant}", this.Tenant);
  }

  private validateResolved() {
    if (!this.tenantDiscoveryResponse) {
      throw "Please call ResolveEndpointsAsync first";
    }
  }

  /*
   * A URL that is the authority set by the developer
   */
  public get CanonicalAuthority(): string {
    return this.canonicalAuthority;
  }

  public set CanonicalAuthority(url: string) {
    this.canonicalAuthority = Utils.CanonicalizeUri(url);
    this.canonicalAuthorityUrlComponents = null;
  }

  private canonicalAuthority: string;
  private canonicalAuthorityUrlComponents: IUri;

  public get CanonicalAuthorityUrlComponents(): IUri {
    if (!this.canonicalAuthorityUrlComponents) {
      this.canonicalAuthorityUrlComponents = Utils.GetUrlComponents(this.CanonicalAuthority);
    }

    return this.canonicalAuthorityUrlComponents;
  }

  /*
   * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
   */
  protected get DefaultOpenIdConfigurationEndpoint(): string {
    return `${this.CanonicalAuthority}v2.0/.well-known/openid-configuration`;
  }

  /*
   * Given a string, validate that it is of the form https://domain/path
   */
  private validateAsUri() {
    let components;
    try {
      components = this.CanonicalAuthorityUrlComponents;
    } catch (e) {
      throw ErrorMessage.invalidAuthorityType;
    }

    if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
      throw ErrorMessage.authorityUriInsecure;
    }

    if (!components.PathSegments || components.PathSegments.length < 1) {
      throw ErrorMessage.authorityUriInvalidPath;
    }
  }

  /*
   * Calls the OIDC endpoint and returns the response
   */
  private DiscoverEndpoints(openIdConfigurationEndpoint: string): Promise<ITenantDiscoveryResponse> {
    let client = new XhrClient();
    return client.sendRequestAsync(openIdConfigurationEndpoint, "GET", /*enableCaching: */ true)
        .then((response: any) => {
            return <ITenantDiscoveryResponse>{
                AuthorizationEndpoint: response.authorization_endpoint,
                EndSessionEndpoint: response.end_session_endpoint,
                Issuer: response.issuer
            };
        });
  }

  /*
   * Returns a promise.
   * Checks to see if the authority is in the cache
   * Discover endpoints via openid-configuration
   * If successful, caches the endpoint for later use in OIDC
   */
  public ResolveEndpointsAsync(): Promise<Authority> {
    let openIdConfigurationEndpoint = "";
    return this.GetOpenIdConfigurationEndpointAsync().then(openIdConfigurationEndpointResponse => {
      openIdConfigurationEndpoint = openIdConfigurationEndpointResponse;
      return this.DiscoverEndpoints(openIdConfigurationEndpoint);
    }).then((tenantDiscoveryResponse: ITenantDiscoveryResponse) => {
      this.tenantDiscoveryResponse = tenantDiscoveryResponse;
      return this;
    });
  }

  /*
   * Returns a promise with the TenantDiscoveryEndpoint
   */
  public abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
}
