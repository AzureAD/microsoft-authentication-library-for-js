/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import pkg from "../../package.json";
import { StringUtils } from "../utils/StringUtils";

export type LoggerMessageOptions = {
    logLevel: LogLevel,
    correlationId?: string,
    containsPii?: boolean
};

export enum LogLevel {
    Error,
    Warning,
    Info,
    Verbose
};

export interface ILoggerCallback {
    (level: LogLevel, message: string, containsPii: boolean): void;
}

export class Logger {

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

    constructor(localCallback: ILoggerCallback, piiLoggingEnabled: boolean) {
        this.localCallback = localCallback;
        this.piiLoggingEnabled = piiLoggingEnabled;
    }

    /**
     * @hidden
     */
    private logMessage(logMessage: string, options: LoggerMessageOptions): void {
        if ((options.logLevel > this.level) || (!this.piiLoggingEnabled && options.containsPii)) {
            return;
        }
        const timestamp = new Date().toUTCString();
        let log: string;
        if (!StringUtils.isEmpty(this.correlationId)) {
            log = timestamp + ":" + this.correlationId + "-" + pkg.version + "-" + LogLevel[options.logLevel] + " " + logMessage;
        }
        else {
            log = timestamp + ":" + pkg.version + "-" + LogLevel[options.logLevel] + " " + logMessage;
        }
        this.executeCallback(options.logLevel, log, options.containsPii);
    }

    /**
     * @hidden
     */
    executeCallback(level: LogLevel, message: string, containsPii: boolean): void {
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
        }
    }

    /**
     * @hidden
     */
    error(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Error,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    errorPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Error,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    warning(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Warning,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    warningPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Warning,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    info(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Info,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    infoPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Info,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    verbose(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Verbose,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * @hidden
     */
    verbosePii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Verbose,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    isPiiLoggingEnabled(): boolean {
        return this.piiLoggingEnabled;
    }
}
