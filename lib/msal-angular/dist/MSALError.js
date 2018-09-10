export class MSALError {
    constructor(error, errorDesc, scopes) {
        this._error = "";
        this._errorDesc = "";
        this._scopes = "";
        this._error = error;
        if (errorDesc) {
            this._errorDesc = errorDesc;
        }
        if (scopes) {
            this._scopes = scopes;
        }
    }
    get error() {
        return this._error;
    }
    set error(value) {
        this._error = value;
    }
    get errorDesc() {
        return this._errorDesc;
    }
    set errorDesc(value) {
        this._errorDesc = value;
    }
    get scopes() {
        return this._scopes;
    }
    set scopes(value) {
        this._scopes = value;
    }
}
//# sourceMappingURL=MSALError.js.map