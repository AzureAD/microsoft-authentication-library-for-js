namespace MSAL {
    export class Logging {
        static _logLevel: number = 0;
        static _loginCallback: Function = null;
        static _correlationId: string = null;
        static initialize(logLevel: number, loginCallback: Function, correlationId?: string) {
            this._logLevel = logLevel;
            this._loginCallback = loginCallback;
            this._correlationId = correlationId;
        }
    }
}