export class AuthenticationResult {
    private _token: string = "";
    private _tokenType: string = "";

    constructor(token: string, tokenType?: string) {
        this._token = token;
        if (tokenType) {
            this._tokenType = tokenType;
        }
    }

    get token(): string {
        return this._token;
    }

    set token(value: string) {
        this._token = value;
    }

    get tokenType(): string {
        return this._tokenType;
    }

    set tokenType(value: string) {
        this._tokenType = value;
    }

}

