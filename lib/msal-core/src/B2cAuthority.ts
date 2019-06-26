// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AadAuthority } from "./AadAuthority";
import { Authority, AuthorityType } from "./Authority";
import { ClientConfigurationErrorMessage } from "./error/ClientConfigurationError";
import { Utils } from "./Utils";

/**
 * @hidden
 */
export class B2cAuthority extends AadAuthority {
  public static B2C_PREFIX: String = "tfp";
  public constructor(authority: string, validateAuthority: boolean) {
    super(authority, validateAuthority);
    const urlComponents = Utils.GetUrlComponents(authority);

    const pathSegments = urlComponents.PathSegments;
    if (pathSegments.length < 3) {
        throw ClientConfigurationErrorMessage.b2cAuthorityUriInvalidPath;
    }

    this.CanonicalAuthority = `https://${urlComponents.HostNameAndPort}/${pathSegments[0]}/${pathSegments[1]}/${pathSegments[2]}/`;
  }

  public get AuthorityType(): AuthorityType {
    return AuthorityType.B2C;
  }

  /**
   * Returns a promise with the TenantDiscoveryEndpoint
   */
  public GetOpenIdConfigurationEndpointAsync(): Promise<string> {
    const resultPromise = new Promise<string>((resolve, reject) =>
      resolve(this.DefaultOpenIdConfigurationEndpoint));

    if (!this.IsValidationEnabled) {
      return resultPromise;
    }

    if (this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
      return resultPromise;
    }

    return new Promise<string>((resolve, reject) =>
      reject(ClientConfigurationErrorMessage.unsupportedAuthorityValidation));
  }
}
