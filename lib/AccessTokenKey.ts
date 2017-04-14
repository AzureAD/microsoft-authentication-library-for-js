namespace MSAL {
    export class AccessTokenKey {
        authority: string;
        clientId: string;
        userIdentifier: string;
        Scopes: string;

        constructor(authority: string, clientId: string, scopes: string, uid: string,utid:string) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.userIdentifier = Utils.base64EncodeStringUrlSafe(uid) + "." + Utils.base64EncodeStringUrlSafe(utid);
        }
    }
}
