"use strict";

namespace Msal {
	
	/**
    * @hidden
    */
    export class AccessTokenKey {

        authority: string;
        clientId: string;
        userIdentifier: string;
        scopes: string;

        constructor(authority: string, clientId: string, scopes: string, uid: string, utid: string) {
            this.authority = authority;
            this.clientId = clientId;
            this.scopes = scopes;
            this.userIdentifier = Utils.base64EncodeStringUrlSafe(uid) + "." + Utils.base64EncodeStringUrlSafe(utid);
        }
    }
}
