export declare class MSALException extends Error {
    private _errorCode;
    private _errorMessage;
    constructor(errorCode: string, errorMessage: string);
    errorCode: string;
    errorMessage: string;
}
