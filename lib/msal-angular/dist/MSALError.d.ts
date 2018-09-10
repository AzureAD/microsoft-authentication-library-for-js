export declare class MSALError {
    private _error;
    private _errorDesc;
    private _scopes;
    constructor(error: string, errorDesc?: string, scopes?: string);
    error: string;
    errorDesc: string;
    scopes: string;
}
