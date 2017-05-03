"use strict";

namespace Msal {// Singleton Class

    /**
    * @hidden
    */
    export class RequestContext {

        private static _instance: RequestContext;
        private _correlationId: string;
        get correlationId(): string { return this._correlationId; }
        private _logger: Logger;
        get logger(): Logger { return this._logger; }

        constructor(correlationId: string) {
            if (RequestContext._instance) {
                return RequestContext._instance;
            }

            this._logger = new Logger(correlationId);
            this._correlationId = this._logger.correlationId;
            RequestContext._instance = this;
        }
    }
}
