namespace MSAL {
    export class AccessTokenValue {
        accessToken: string;
        idToken: string;
        expiresIn: string;
        clientInfo: string;
        constructor(idToken: string, accessToken: string, expiresIn: string, clientInfo: string) {
            this.idToken = idToken;
            this.accessToken = accessToken;
            this.expiresIn = expiresIn;
            this.clientInfo = clientInfo;
        }
    }
}