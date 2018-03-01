"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var Utils_1 = require("./Utils");
var User = /** @class */ (function () {
    /*
     * @hidden
     */
    function User(displayableId, name, identityProvider, userIdentifier, idToken) {
        this.displayableId = displayableId;
        this.name = name;
        this.identityProvider = identityProvider;
        this.userIdentifier = userIdentifier;
        this.idToken = idToken;
    }
    /*
     * @hidden
     */
    User.createUser = function (idToken, clientInfo, authority) {
        var uid;
        var utid;
        if (!clientInfo) {
            uid = "";
            utid = "";
        }
        else {
            uid = clientInfo.uid;
            utid = clientInfo.utid;
        }
        var userIdentifier = Utils_1.Utils.base64EncodeStringUrlSafe(uid) + "." + Utils_1.Utils.base64EncodeStringUrlSafe(utid);
        return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier, idToken.decodedIdToken);
    };
    return User;
}());
exports.User = User;
//# sourceMappingURL=User.js.map