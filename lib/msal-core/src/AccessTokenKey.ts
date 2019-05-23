// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Utils } from "./Utils";

/**
 * @hidden
 */
export class AccessTokenKey {

  authority: string;
  clientId: string;
  scopes: string;
  homeAccountIdentifier: string;

  constructor(authority: string, clientId: string, scopes: string, uid: string, utid: string) {
    this.authority = Utils.CanonicalizeUri(authority);
    this.clientId = clientId;
    this.scopes = scopes;
    this.homeAccountIdentifier = Utils.base64EncodeStringUrlSafe(uid) + "." + Utils.base64EncodeStringUrlSafe(utid);
  }
}
