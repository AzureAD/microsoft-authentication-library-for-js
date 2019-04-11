// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { IUri } from "./IUri";
import { Utils } from "./Utils";
import { ITenantDiscoveryResponse } from "./ITenantDiscoveryResponse";
import { ClientConfigurationErrorMessage } from "./error/ClientConfigurationError";
import { XhrClient } from "./XHRClient";

/**
 * @hidden
 */
export enum AuthorityType {
  Aad,
  Adfs,
  B2C
}

/**
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

  /**
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

  /**
   * // http://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
   */
  protected get DefaultOpenIdConfigurationEndpoint(): string {
    return `${this.CanonicalAuthority}v2.0/.well-known/openid-configuration`;
  }

  /**
   * Given a string, validate that it is of the form https://domain/path
   */
  private validateAsUri() {
    let components;
    try {
      components = this.CanonicalAuthorityUrlComponents;
    } catch (e) {
      throw ClientConfigurationErrorMessage.invalidAuthorityType;
    }

    if (!components.Protocol || components.Protocol.toLowerCase() !== "https:") {
      throw ClientConfigurationErrorMessage.authorityUriInsecure;
    }

    if (!components.PathSegments || components.PathSegments.length < 1) {
      throw ClientConfigurationErrorMessage.authorityUriInvalidPath;
    }
  }

  /**
   * Calls the OIDC endpoint and returns the response
   */
  private DiscoverEndpoints(openIdConfigurationEndpoint: string): Promise<ITenantDiscoveryResponse> {
    const client = new XhrClient();
    return client.sendRequestAsync(openIdConfigurationEndpoint, "GET", /*enableCaching: */ true)
        .then((response: any) => {
            return <ITenantDiscoveryResponse>{
                AuthorizationEndpoint: response.authorization_endpoint,
                EndSessionEndpoint: response.end_session_endpoint,
                Issuer: response.issuer
            };
        });
  }

  /**
   * Returns a promise.
   * Checks to see if the authority is in the cache
   * Discover endpoints via openid-configuration
   * If successful, caches the endpoint for later use in OIDC
   */
  public resolveEndpointsAsync(): Promise<Authority> {
    let openIdConfigurationEndpoint = "";
    return this.GetOpenIdConfigurationEndpointAsync().then(openIdConfigurationEndpointResponse => {
      openIdConfigurationEndpoint = openIdConfigurationEndpointResponse;
      return this.DiscoverEndpoints(openIdConfigurationEndpoint);
    }).then((tenantDiscoveryResponse: ITenantDiscoveryResponse) => {
      this.tenantDiscoveryResponse = tenantDiscoveryResponse;
      return this;
    });
  }

  /**
   * Returns a promise with the TenantDiscoveryEndpoint
   */
  public abstract GetOpenIdConfigurationEndpointAsync(): Promise<string>;
}
