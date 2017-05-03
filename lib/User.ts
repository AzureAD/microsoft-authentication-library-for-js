"use strict";

namespace Msal {

    export class User {

        displayableId: string;
        name: string;
        identityProvider: string;
        userIdentifier:string;

        /**
        * @hidden
        */
        constructor(displayableId: string, name: string, identityProvider: string, userIdentifier: string) {
            this.displayableId = displayableId;
            this.name = name;
            this.identityProvider = identityProvider;
            this.userIdentifier = userIdentifier;
        }

        /**
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
            return new User(idToken.preferredName, idToken.name, idToken.issuer, userIdentifier);
        }
    }
}