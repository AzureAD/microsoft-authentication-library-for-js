/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
export interface ILoggerCallback {
    (level: LogLevel, message: string, containsPii: boolean): void;
}
export declare enum LogLevel {
    Error = 0,
    Warning = 1,
    Info = 2,
    Verbose = 3
}
export declare class Logger {
    private static _instance;
    private _correlationId;
    private _level;
    private _piiLoggingEnabled;
    private _localCallback;
    constructor(localCallback: ILoggerCallback, options?: {
        correlationId?: string;
        level?: LogLevel;
        piiLoggingEnabled?: boolean;
    });
    private logMessage;
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
