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

import { AadAuthority } from "./AadAuthority";
import { Authority, AuthorityType } from "./Authority";
import { ErrorMessage } from "./ErrorMessage";
import { Utils } from "./Utils";

/*
 * @hidden
 */
export class B2cAuthority extends AadAuthority {
  public constructor(authority: string, validateAuthority: boolean) {
    super(authority, validateAuthority);
    let urlComponents = Utils.GetUrlComponents(authority);

    let pathSegments = urlComponents.PathSegments;
    if (pathSegments.length < 3) {
        throw ErrorMessage.b2cAuthorityUriInvalidPath;
    }

    this.CanonicalAuthority = `https://${urlComponents.HostNameAndPort}/${pathSegments[0]}/${pathSegments[1]}/${pathSegments[2]}/`;
  }

  public get AuthorityType(): AuthorityType {
    return AuthorityType.B2C;
  }

  /*
   * Returns a promise with the TenantDiscoveryEndpoint
   */
  public GetOpenIdConfigurationEndpointAsync(): Promise<string> {
    var resultPromise = new Promise<string>((resolve, reject) =>
      resolve(this.DefaultOpenIdConfigurationEndpoint));

    if (!this.IsValidationEnabled) {
      return resultPromise;
    }

    if (this.IsInTrustedHostList(this.CanonicalAuthorityUrlComponents.HostNameAndPort)) {
      return resultPromise;
    }

    return new Promise<string>((resolve, reject) =>
      reject(ErrorMessage.unsupportedAuthorityValidation));
  }
}
