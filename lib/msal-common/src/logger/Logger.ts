/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringUtils } from "../utils/StringUtils";
import { LoggerOptions } from "../config/ClientConfiguration";
import { Constants } from "../utils/Constants";

/**
 * Options for logger messages.
 */
export type LoggerMessageOptions = {
    logLevel: LogLevel,
    correlationId?: string,
    containsPii?: boolean,
    context?: string
};

/**
 * Log message level.
 */
export enum LogLevel {
    Error,
    Warning,
    Info,
    Verbose,
    Trace
}

/**
 * Callback to send the messages to.
 */
export interface ILoggerCallback {
    (level: LogLevel, message: string, containsPii: boolean): void;
}

/**
 * Class which facilitates logging of messages to a specific place.
 */
export class Logger {

    // Correlation ID for request, usually set by user.
    private correlationId: string;

    // Current log level, defaults to info.
    private level: LogLevel = LogLevel.Info;

    // Boolean describing whether PII logging is allowed.
    private piiLoggingEnabled: boolean;

    // Callback to send messages to.
    private localCallback: ILoggerCallback;

    // Package name implementing this logger
    private packageName: string;

    // Package version implementing this logger
    private packageVersion: string;

    constructor(loggerOptions: LoggerOptions, packageName?: string, packageVersion?: string) {
        const defaultLoggerCallback = () => {};
        this.localCallback = loggerOptions.loggerCallback || defaultLoggerCallback;
        this.piiLoggingEnabled = loggerOptions.piiLoggingEnabled || false;
        this.level = loggerOptions.logLevel || LogLevel.Info;

        this.packageName = packageName || Constants.EMPTY_STRING;
        this.packageVersion = packageVersion || Constants.EMPTY_STRING;
    }

    /**
     * Create new Logger with existing configurations.
     */
    public clone(packageName: string, packageVersion: string): Logger {
        return new Logger({loggerCallback: this.localCallback, piiLoggingEnabled: this.piiLoggingEnabled, logLevel: this.level}, packageName, packageVersion);
    }

    /**
     * Log message with required options.
     */
    private logMessage(logMessage: string, options: LoggerMessageOptions): void {
        if ((options.logLevel > this.level) || (!this.piiLoggingEnabled && options.containsPii)) {
            return;
        }
        const timestamp = new Date().toUTCString();
        const logHeader: string = StringUtils.isEmpty(this.correlationId) ? `[${timestamp}] : ` : `[${timestamp}] : [${this.correlationId}]`;
        const log = `${logHeader} : ${this.packageName}@${this.packageVersion} : ${LogLevel[options.logLevel]} - ${logMessage}`;
        // debug(`msal:${LogLevel[options.logLevel]}${options.containsPii ? "-Pii": ""}${options.context ? `:${options.context}` : ""}`)(logMessage);
        this.executeCallback(options.logLevel, log, options.containsPii || false);
    }

    /**
     * Execute callback with message.
     */
    executeCallback(level: LogLevel, message: string, containsPii: boolean): void {
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
        }
    }

    /**
     * Logs error messages.
     */
    error(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Error,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs error messages with PII.
     */
    errorPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Error,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs warning messages.
     */
    warning(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Warning,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs warning messages with PII.
     */
    warningPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Warning,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs info messages.
     */
    info(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Info,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs info messages with PII.
     */
    infoPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Info,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs verbose messages.
     */
    verbose(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Verbose,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs verbose messages with PII.
     */
    verbosePii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Verbose,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs trace messages.
     */
    trace(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Trace,
            containsPii: false,
            correlationId: correlationId || ""
        });
    }

    /**
     * Logs trace messages with PII.
     */
    tracePii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Trace,
            containsPii: true,
            correlationId: correlationId || ""
        });
    }

    /**
     * Returns whether PII Logging is enabled or not.
     */
    isPiiLoggingEnabled(): boolean {
        return this.piiLoggingEnabled || false;
    }
}
