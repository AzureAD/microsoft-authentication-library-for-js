// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Utils } from "./Utils";
import { ClientAuthError } from "./error/ClientAuthError";

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
  decodedIdToken: Object;
  sid: string;
  /* tslint:disable:no-string-literal */
  constructor(rawIdToken: string) {
    if (Utils.isEmpty(rawIdToken)) {
      throw ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
    }
    try {
      this.rawIdToken = rawIdToken;
      this.decodedIdToken = Utils.extractIdToken(rawIdToken);
      if (this.decodedIdToken) {
        if (this.decodedIdToken.hasOwnProperty("iss")) {
          this.issuer = this.decodedIdToken["iss"];
        }

        if (this.decodedIdToken.hasOwnProperty("oid")) {
            this.objectId = this.decodedIdToken["oid"];
        }

        if (this.decodedIdToken.hasOwnProperty("sub")) {
          this.subject = this.decodedIdToken["sub"];
        }

        if (this.decodedIdToken.hasOwnProperty("tid")) {
          this.tenantId = this.decodedIdToken["tid"];
        }

        if (this.decodedIdToken.hasOwnProperty("ver")) {
          this.version = this.decodedIdToken["ver"];
        }

        if (this.decodedIdToken.hasOwnProperty("preferred_username")) {
          this.preferredName = this.decodedIdToken["preferred_username"];
        }

        if (this.decodedIdToken.hasOwnProperty("name")) {
          this.name = this.decodedIdToken["name"];
        }

        if (this.decodedIdToken.hasOwnProperty("nonce")) {
          this.nonce = this.decodedIdToken["nonce"];
        }

        if (this.decodedIdToken.hasOwnProperty("exp")) {
          this.expiration = this.decodedIdToken["exp"];
        }

        if (this.decodedIdToken.hasOwnProperty("home_oid")) {
            this.homeObjectId = this.decodedIdToken["home_oid"];
        }

        if (this.decodedIdToken.hasOwnProperty("sid")) {
            this.sid = this.decodedIdToken["sid"];
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
