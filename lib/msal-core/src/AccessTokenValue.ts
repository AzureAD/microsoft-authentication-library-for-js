// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

/**
 * @hidden
 */
export class AccessTokenValue {

  accessToken: string;
  accessTokenType: string;
  idToken: string;
  expiresIn: string;
  homeAccountIdentifier: string;

  constructor(accessToken: string, idToken: string, expiresIn: string, homeAccountIdentifier: string, accessTokenType: string) {
    this.accessToken = accessToken;
    this.accessTokenType = accessTokenType;
    this.idToken = idToken;
    this.expiresIn = expiresIn;
    this.homeAccountIdentifier = homeAccountIdentifier;
  }
}
