namespace MSAL {
    export class AccessTokenKey {
        authority: string;
        clientId: string;
        homeObjectId: string;
        Scopes: string;

        constructor(authority: string, clientId: string, scopes: string, homeObjectId: string) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.homeObjectId = homeObjectId;
        }
    }
}
