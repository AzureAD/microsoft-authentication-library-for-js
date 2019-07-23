// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Utils } from "./Utils";
import { UrlProcessor } from "./UrlProcessor";

/**
 * @hidden
 */
export class AccessTokenKey {

  authority: string;
  clientId: string;
  scopes: string;
  homeAccountIdentifier: string;

  constructor(authority: string, clientId: string, scopes: string, uid: string, utid: string) {
    this.authority = UrlProcessor.CanonicalizeUri(authority);
    this.clientId = clientId;
    this.scopes = scopes;
    this.homeAccountIdentifier = Utils.base64Encode(uid) + "." + Utils.base64Encode(utid);
  }
}
