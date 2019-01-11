export class MSALError {
    private _error: string="";
    private _errorDesc: string="";
    private _scopes: string="";


    constructor(error: string , errorDesc?: string, scopes?:string)
    {
        this._error = error;
        if(errorDesc) {
            this._errorDesc = errorDesc;
        }
        if(scopes) {
            this._scopes = scopes;
        }
    }

    get error(): string {
        return this._error;
    }

    set error(value: string) {
        this._error = value;
    }

    get errorDesc(): string {
        return this._errorDesc;
    }

    set errorDesc(value: string) {
        this._errorDesc = value;
    }

    get scopes(): string {
        return this._scopes;
    }

    set scopes(value: string) {
        this._scopes = value;
    }
}