export class MSALException extends Error {

   private _errorCode: string;
   private _errorMessage: string;

    constructor(errorCode: string, errorMessage: string) {
        super();
        this._errorCode = errorCode;
        this._errorMessage = errorMessage;
    }

    get errorCode(): string {
        return this._errorCode ? this._errorCode : "";
    }

    set errorCode(errorCode: string) {
        this._errorCode = errorCode;
    }

    get errorMessage(): string {
        return this._errorMessage ? this._errorMessage : "";
    }

    set errorMessage(errorMessage: string) {
        this._errorMessage = errorMessage;
    }
}