export interface ILoggerCallback {
    (level: LogLevel, message: string, containsPii: boolean): void;
}
export declare enum LogLevel {
    Error = 0,
    Warning = 1,
    Info = 2,
    Verbose = 3,
}
export declare class Logger {
    private static _instance;
    private _correlationId;
    correlationId: string;
    private _level;
    level: LogLevel;
    private _piiLoggingEnabled;
    piiLoggingEnabled: boolean;
    private _localCallback;
    localCallback: ILoggerCallback;
    constructor(correlationId: string);
    private logMessage(logMessage, logLevel, containsPii);
    executeCallback(level: LogLevel, message: string, containsPii: boolean): void;
    error(message: string): void;
    errorPii(message: string): void;
    warning(message: string): void;
    warningPii(message: string): void;
    info(message: string): void;
    infoPii(message: string): void;
    verbose(message: string): void;
    verbosePii(message: string): void;
}
