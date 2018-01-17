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

import { ClientInfo } from "./ClientInfo";
import { IdToken } from "./IdToken";
import { Utils } from "./Utils";

export class User {

    displayableId: string;
    name: string;
    identityProvider: string;
    userIdentifier: string;
    idToken: Object

    /*
     * @hidden
     */
    constructor(displayableId: string, name: string, identityProvider: string, userIdentifier: string, idToken:Object) {
        this.displayableId = displayableId;
        this.name = name;
        this.identityProvider = identityProvider;
        this.userIdentifier = userIdentifier;
        this.idToken = idToken;
    }

    /*
     * @hidden
     */
    static createUser(idToken: IdToken, clientInfo: ClientInfo, authority: string): User {
        let uid: string;
        let utid: string;
        if (!clientInfo) {
            uid = "";
            utid = "";
        }
        else {
            uid = clientInfo.uid;
            utid = clientInfo.utid;
        }

        const userIdentifier = Utils.base64EncodeStringUrlSafe(uid) + "." + Utils.base64EncodeStringUrlSafe(utid);
        return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier, idToken.decodedIdToken);
    }
}