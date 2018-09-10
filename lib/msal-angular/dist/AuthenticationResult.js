export class AuthenticationResult {
    constructor(token, tokenType) {
        this._token = "";
        this._tokenType = "";
        this._token = token;
        if (tokenType) {
            this._tokenType = tokenType;
        }
    }
    get token() {
        return this._token;
    }
    set token(value) {
        this._token = value;
    }
    get tokenType() {
        return this._tokenType;
    }
    set tokenType(value) {
        this._tokenType = value;
    }
}
//# sourceMappingURL=AuthenticationResult.js.map