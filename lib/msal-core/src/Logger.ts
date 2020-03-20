/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import debug from "debug";
import { StringUtils } from "./utils/StringUtils";
import { libraryVersion } from "./utils/Constants";

export interface ILoggerCallback {
    (level: LogLevel, message: string, containsPii: boolean): void;
}

export enum LogLevel {
    Error,
    Warning,
    Info,
    Verbose
}

export class Logger {// Singleton Class

    /**
     * @hidden
     */
    // TODO: This does not seem to be a singleton!! Change or Delete.
    private static instance: Logger;

    /**
     * @hidden
     */
    private correlationId: string;

    /**
     * @hidden
     */
    private level: LogLevel = LogLevel.Info;

    /**
     * @hidden
     */
    private piiLoggingEnabled: boolean;

    /**
     * @hidden
     */
    private localCallback: ILoggerCallback;

    constructor(localCallback: ILoggerCallback,
        options:
        {
            correlationId?: string,
            level?: LogLevel,
            piiLoggingEnabled?: boolean,
        } = {}) {
        const {
            correlationId = "",
            level = LogLevel.Info,
            piiLoggingEnabled = false
        } = options;

        this.localCallback = localCallback;
        this.correlationId = correlationId;
        this.level = level;
        this.piiLoggingEnabled = piiLoggingEnabled;
    }

    /**
     * @hidden
     */
    private logMessage(logLevel: LogLevel, logMessage: string, context: string, containsPii: boolean): void {
        if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
            return;
        }
        const timestamp = new Date().toUTCString();
        let log: string;
        if (!StringUtils.isEmpty(this.correlationId)) {
            log = timestamp + ":" + this.correlationId + "-" + libraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
        }
        else {
            log = timestamp + ":" + libraryVersion() + "-" + LogLevel[logLevel] + " " + logMessage;
        }

        debug(`msal:${LogLevel[logLevel]}${containsPii ? `-Pii`: ""}${context ? `:${context}` : ""}`)(logMessage);
        this.executeCallback(logLevel, log, containsPii);
    }

    /**
     * @hidden
     */
    executeCallback(level: LogLevel, message: string, containsPii: boolean) {
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
        }
    }

    /**
     * @hidden
     */
    error(message: string, context?: string): void {
        this.logMessage(LogLevel.Error, message, context, false);
    }

    /**
     * @hidden
     */
    errorPii(message: string, context?: string): void {
        this.logMessage(LogLevel.Error, message, context, true);
    }

    /**
     * @hidden
     */
    warning(message: string, context?: string): void {
        this.logMessage(LogLevel.Warning, message, context, false);
    }

    /**
     * @hidden
     */
    warningPii(message: string, context:string): void {
        this.logMessage(LogLevel.Warning, message, context, true);
    }

    /**
     * @hidden
     */
    info(message: string, context?: string): void {
        this.logMessage(LogLevel.Info, message, context, false);
    }

    /**
     * @hidden
     */
    infoPii(message: string, context?: string): void {
        this.logMessage(LogLevel.Info, message, context, true);
    }

    /**
     * @hidden
     */
    verbose(message: string, context?: string): void {
        this.logMessage(LogLevel.Verbose, message, context, false);
    }

    /**
     * @hidden
     */
    verbosePii(message: string, context?: string): void {
        this.logMessage(LogLevel.Verbose, message, context, true);
    }

    isPiiLoggingEnabled(): boolean {
        return this.piiLoggingEnabled;
    }
}
