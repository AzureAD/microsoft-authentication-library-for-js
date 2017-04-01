namespace MSAL {
    export class AccessTokenValue {
        AccessToken: string;
        ExpiresIn: string;
        constructor(accessToken: string, expiresIn: string) {
            this.AccessToken = accessToken;
            this.ExpiresIn = expiresIn;
        }
    }
}