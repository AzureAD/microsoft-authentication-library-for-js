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
/*
 * @hidden
 */
var IdToken = /** @class */ (function () {
    function IdToken(rawIdToken) {
        if (Utils.isEmpty(rawIdToken)) {
            throw new Error("null or empty raw idtoken");
        }
        try {
            this.rawIdToken = rawIdToken;
            var decodedIdToken = Utils.extractIdToken(rawIdToken);
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
                if (decodedIdToken.hasOwnProperty("roles")) {
                    this.roles = decodedIdToken.roles;
                }
                if (decodedIdToken.hasOwnProperty("groups")) {
                    this.groups = decodedIdToken.groups;
                }
            }
        }
        catch (e) {
            throw new Error("Failed to parse the returned id token");
        }
    }
    return IdToken;
}());
export { IdToken };
//# sourceMappingURL=IdToken.js.map