"use strict";

namespace Msal {

    /**
    * @hidden
    */
    export class AccessTokenValue {

        accessToken: string;
        idToken: string;
        expiresIn: string;
        clientInfo: string;

        constructor(accessToken: string, idToken: string, expiresIn: string, clientInfo: string) {
            this.accessToken = accessToken;
            this.idToken = idToken;
            this.expiresIn = expiresIn;
            this.clientInfo = clientInfo;
        }
    }
}
