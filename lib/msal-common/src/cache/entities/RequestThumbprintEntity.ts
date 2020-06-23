export class RequestThumbprint {
    clientId: string;
    authority: string;
    scopes: Array<string>;
    homeAccountIdentifier?: string;

    constructor(clientId: string, authority: string, scopes: Array<string>, homeAccountIdentifier?: string) {
        this.clientId = clientId;
        this.authority = authority;
        this.scopes = scopes;
        this.homeAccountIdentifier = homeAccountIdentifier;
    }

    // base64Encode function

    // base64Decode function

    // generateCacheKey
}