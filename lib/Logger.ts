namespace MSAL {

    export interface ILoggerCallback {
        (level: LogLevel, message: string,containsPii:boolean): void;
    }

    export enum LogLevel {
        Error,
        Warning,
        Info,
        Verbose
    }

    export class Logger {// Singleton Class
        private static _instance: Logger;
        private _correlationId: string;
        get correlationId(): string { return this._correlationId; }
        set correlationId(correlationId: string) {
            this._correlationId = correlationId;
        };
        private _level: LogLevel = LogLevel.Info;
        get level(): LogLevel { return this._level; }
        set level(logLevel: LogLevel) {
            if (LogLevel[logLevel]) {
                this._level = logLevel;
            }
            else throw new Error("Provide a valid value for level. Possibles range for logLevel is 0-3");
        };

        private _piiLoggingEnabled: boolean = false;
        get piiLoggingEnabled(): boolean { return this._piiLoggingEnabled; }
        set piiLoggingEnabled(piiLoggingEnabled: boolean) {
            this._piiLoggingEnabled = piiLoggingEnabled;
        };

        private _localCallback: ILoggerCallback;
        get localCallback(): ILoggerCallback { return this._localCallback; }
        set localCallback(localCallback: ILoggerCallback) {
            if (this.localCallback) {
                throw new Error("MSAL logging callback can only be set once per process and should never change once set.");
            }
            this._localCallback = localCallback;
        };

        constructor(correlationId: string) {
            if (Logger._instance) {
                return Logger._instance;
            }
            this._correlationId = correlationId;
            Logger._instance = this;
        }

        private LogMessage(logMessage: string, logLevel: LogLevel, containsPii: boolean) {
            if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
                return;
            }
            var timestamp = new Date().toUTCString();
            var log: string = '';
            if (!Utils.isEmpty(this.correlationId)) {
                log = timestamp + ':' + this._correlationId + '-' + Utils.GetLibraryVersion() + '-' + LogLevel[logLevel] + ' ' + logMessage;
            }
            else {
                log = timestamp + ':' + Utils.GetLibraryVersion() + '-' + LogLevel[logLevel] + ' ' + logMessage;
            }
            this.executeCallback(logLevel, log, containsPii);
        }

        executeCallback(level: LogLevel, message: string, containsPii: boolean) {
            if (this.localCallback) {
                this.localCallback(level, message, containsPii);
            }
        }

        error(message: string): void {
            this.LogMessage(message, LogLevel.Error, false);
        }

        errorPii(message: string): void {
            this.LogMessage(message, LogLevel.Error, true);
        }

        warning(message: string): void {
            this.LogMessage(message, LogLevel.Warning, false);
        }

        warningPii(message: string): void {
            this.LogMessage(message, LogLevel.Warning, true);
        }

        info(message: string): void {
            this.LogMessage(message, LogLevel.Info, false);
        }

        infoPii(message: string): void {
            this.LogMessage(message, LogLevel.Info, true);
        }

        verbose(message: string): void {
            this.LogMessage(message, LogLevel.Verbose, false);
        }

        verbosePii(message: string): void {
            this.LogMessage(message, LogLevel.Verbose, true);
        }
    }
}
