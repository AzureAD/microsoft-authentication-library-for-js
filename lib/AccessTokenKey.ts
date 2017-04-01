namespace MSAL {
    export class AccessTokenKey {
        authority: string;
        clientId: string;
        user: User;
        Scopes: string;

        constructor(authority: string, clientId: string, user: User, scopes: string) {
            this.authority = authority;
            this.clientId = clientId;
            this.Scopes = scopes;
            this.user = user;
        }
    }
}