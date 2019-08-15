// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ClientAuthError } from "./error/ClientAuthError";
import { TokenUtils } from "./utils/TokenUtils";
import { StringDict } from "./MsalTypes";
import { StringUtils } from "./utils/StringUtils";

/**
 * @hidden
 */
export class IdToken {

  issuer: string;
  objectId: string;
  subject: string;
  tenantId: string;
  version: string;
  preferredName: string;
  name: string;
  homeObjectId: string;
  nonce: string;
  expiration: string;
  rawIdToken: string;
  claims: StringDict;
  sid: string;
  /* tslint:disable:no-string-literal */
  constructor(rawIdToken: string) {
    if (StringUtils.isEmpty(rawIdToken)) {
      throw ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
    }
    try {
      this.rawIdToken = rawIdToken;
      this.claims = TokenUtils.extractIdToken(rawIdToken);
      if (this.claims) {
        if (this.claims.hasOwnProperty("iss")) {
          this.issuer = this.claims["iss"];
        }

        if (this.claims.hasOwnProperty("oid")) {
            this.objectId = this.claims["oid"];
        }

        if (this.claims.hasOwnProperty("sub")) {
          this.subject = this.claims["sub"];
        }

        if (this.claims.hasOwnProperty("tid")) {
          this.tenantId = this.claims["tid"];
        }

        if (this.claims.hasOwnProperty("ver")) {
          this.version = this.claims["ver"];
        }

        if (this.claims.hasOwnProperty("preferred_username")) {
          this.preferredName = this.claims["preferred_username"];
        }

        if (this.claims.hasOwnProperty("name")) {
          this.name = this.claims["name"];
        }

        if (this.claims.hasOwnProperty("nonce")) {
          this.nonce = this.claims["nonce"];
        }

        if (this.claims.hasOwnProperty("exp")) {
          this.expiration = this.claims["exp"];
        }

        if (this.claims.hasOwnProperty("home_oid")) {
            this.homeObjectId = this.claims["home_oid"];
        }

        if (this.claims.hasOwnProperty("sid")) {
            this.sid = this.claims["sid"];
        }
      /* tslint:enable:no-string-literal */
      }
    } catch (e) {
      // TODO: This error here won't really every be thrown, since extractIdToken() returns null if the decodeJwt() fails.
      // Need to add better error handling here to account for being unable to decode jwts.
      throw ClientAuthError.createIdTokenParsingError(e);
    }
  }

}
