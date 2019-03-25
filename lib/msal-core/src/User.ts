// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ClientInfo } from "./ClientInfo";
import { IdToken } from "./IdToken";
import { Utils } from "./Utils";

export class User {

    displayableId: string;
    name: string;
    identityProvider: string;
    userIdentifier: string;
    idToken: Object;
    sid: string;

    /**
     * @hidden
     */
    constructor(displayableId: string, name: string, identityProvider: string, userIdentifier: string, idToken: Object, sid: string) {
        this.displayableId = displayableId;
        this.name = name;
        this.identityProvider = identityProvider;
        this.userIdentifier = userIdentifier;
        this.idToken = idToken;
        this.sid = sid;
    }

    /**
     * @hidden
     */
    static createUser(idToken: IdToken, clientInfo: ClientInfo): User {
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
        return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier, idToken.decodedIdToken, idToken.sid);
    }
}
