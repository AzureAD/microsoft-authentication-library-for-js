/*
  * Copyright (c) Microsoft Corporation
  *  All Rights Reserved
  *  MIT License
  *
  * Permission is hereby granted, free of charge, to any person obtaining a copy of this
  * software and associated documentation files (the "Software"), to deal in the Software
  * without restriction, including without limitation the rights to use, copy, modify,
  * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  * permit persons to whom the Software is furnished to do so, subject to the following
  * conditions:
  *
  * The above copyright notice and this permission notice shall be
  * included in all copies or substantial portions of the Software.
  *
  * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
  * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
  * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
  * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */

import { Utils } from "./Utils";
import { Logger } from "./Logger";

/*
 * @hidden
 */
export class IdToken {

  rawIdToken: string;
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

  constructor(rawIdToken: string) {
    if (Utils.isEmpty(rawIdToken)) {
      throw new Error("null or empty raw idtoken");
    }
    try {
      this.rawIdToken = rawIdToken;
      const decodedIdToken = Utils.extractIdToken(rawIdToken);
      if (decodedIdToken) {
        if (decodedIdToken.hasOwnProperty("iss")) {
          this.issuer = decodedIdToken.iss;
        }

        if (decodedIdToken.hasOwnProperty("oid")) {
          this.objectId = decodedIdToken.oid;
        }

        if (decodedIdToken.hasOwnProperty("sub")) {
          this.subject = decodedIdToken.sub;
        }

        if (decodedIdToken.hasOwnProperty("tid")) {
          this.tenantId = decodedIdToken.tid;
        }

        if (decodedIdToken.hasOwnProperty("ver")) {
          this.version = decodedIdToken.ver;
        }

        if (decodedIdToken.hasOwnProperty("preferred_username")) {
          this.preferredName = decodedIdToken.preferred_username;
        }

        if (decodedIdToken.hasOwnProperty("name")) {
          this.name = decodedIdToken.name;
        }

        if (decodedIdToken.hasOwnProperty("nonce")) {
          this.nonce = decodedIdToken.nonce;
        }

        if (decodedIdToken.hasOwnProperty("exp")) {
          this.expiration = decodedIdToken.exp;
        }
      }
    } catch (e) {
      throw new Error("Failed to parse the returned id token");
    }
  }

  static getClaim(claimName: string, rawIdToken: string, logger: Logger): string {
    if (Utils.isEmpty(rawIdToken)) {
      throw new Error("null or empty raw idtoken");
    }

    if(!logger){
      throw new Error('null or undefined Logger');
    }
    
    const decodedIdToken = Utils.extractIdToken(rawIdToken);

    if (!decodedIdToken){
      logger.warning('unable to decode id token.  raw id token: ' + rawIdToken);
      return null;
    }

    return IdToken.getClaimInternal(claimName, decodedIdToken, logger);
  }

  private static getClaimInternal(claimName: string, decodedIdToken: any, logger: Logger) {
    let res: string = null;

    if (decodedIdToken.hasOwnProperty(claimName)) {
      res = decodedIdToken[claimName];
    }
    else{
      logger.warning('unable to find claim: ' + claimName);
    }

    return res;
  }
}
