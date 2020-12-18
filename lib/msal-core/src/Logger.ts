/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
     * @param logLevel
     * @param logMessage
     * @param containsPii
     * @hidden
     */
    private logMessage(logLevel: LogLevel, logMessage: string, containsPii: boolean): void {
        if ((logLevel > this.level) || (!this.piiLoggingEnabled && containsPii)) {
            return;
        }
        const timestamp = new Date().toUTCString();
        let log: string;
        if (!StringUtils.isEmpty(this.correlationId)) {
            log = timestamp + ":" + this.correlationId + "-" + libraryVersion() + "-" + LogLevel[logLevel] + (containsPii ? "-pii" : "") + " " + logMessage;
        }
        else {
            log = timestamp + ":" + libraryVersion() + "-" + LogLevel[logLevel] + (containsPii ? "-pii" : "") + " " + logMessage;
        }
        this.executeCallback(logLevel, log, containsPii);
    }

    /**
     * @param level
     * @param message
     * @param containsPii
     * @hidden
     */
    executeCallback(level: LogLevel, message: string, containsPii: boolean) {
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
        }
    }

    /**
     * @param message
     * @hidden
     */
    error(message: string): void {
        this.logMessage(LogLevel.Error, message, false);
    }

    /**
     * @param message
     * @hidden
     */
    errorPii(message: string): void {
        this.logMessage(LogLevel.Error, message, true);
    }

    /**
     * @param message
     * @hidden
     */
    warning(message: string): void {
        this.logMessage(LogLevel.Warning, message, false);
    }

    /**
     * @param message
     * @hidden
     */
    warningPii(message: string): void {
        this.logMessage(LogLevel.Warning, message, true);
    }

    /**
     * @param message
     * @hidden
     */
    info(message: string): void {
        this.logMessage(LogLevel.Info, message, false);
    }

    /**
     * @param message
     * @hidden
     */
    infoPii(message: string): void {
        this.logMessage(LogLevel.Info, message, true);
    }

    /**
     * @param message
     * @hidden
     */
    verbose(message: string): void {
        this.logMessage(LogLevel.Verbose, message, false);
    }

    /**
     * @param message
     * @hidden
     */
    verbosePii(message: string): void {
        this.logMessage(LogLevel.Verbose, message, true);
    }

    isPiiLoggingEnabled(): boolean {
        return this.piiLoggingEnabled;
    }
}
