export class ErrorData {
    constructor(error, errorDesc, scopes) {
        this._error = error;
        this._errorDesc = errorDesc;
        this._scopes = scopes;
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
//# sourceMappingURL=errorData.js.map