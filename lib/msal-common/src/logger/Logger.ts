/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { LoggerOptions } from "../config/ClientConfiguration.js";

/**
 * Options for logger messages.
 */
export type LoggerMessageOptions = {
    logLevel: LogLevel;
    containsPii?: boolean;
    context?: string;
    correlationId?: string;
};

/**
 * Log message level.
 */
export enum LogLevel {
    Error,
    Warning,
    Info,
    Verbose,
    Trace,
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
    private cId: string;

    // Current log level, defaults to info.
    private lvl: LogLevel = LogLevel.Info;

    // Boolean describing whether PII logging is allowed.
    private piiEnabled: boolean;

    // Callback to send messages to.
    private lcb: ILoggerCallback;

    // Package name implementing this logger
    private pkgName: string;

    // Package version implementing this logger
    private pkgVer: string;

    constructor(
        loggerOptions: LoggerOptions,
        packageName?: string,
        packageVersion?: string
    ) {
        const defaultLoggerCallback = () => {
            return;
        };
        const setLoggerOptions =
            loggerOptions || Logger.createDefaultLoggerOptions();
        this.lcb =
            setLoggerOptions.loggerCallback || defaultLoggerCallback;
        this.piiEnabled = setLoggerOptions.piiLoggingEnabled || false;
        this.lvl =
            typeof setLoggerOptions.logLevel === "number"
                ? setLoggerOptions.logLevel
                : LogLevel.Info;
        this.cId = setLoggerOptions.correlationId || "";
        this.pkgName = packageName || "";
        this.pkgVer = packageVersion || "";
    }

    private static createDefaultLoggerOptions(): LoggerOptions {
        return {
            loggerCallback: () => {
                // allow users to not set loggerCallback
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Info,
        };
    }

    /**
     * Create new Logger with existing configurations.
     */
    public clone(
        packageName: string,
        packageVersion: string,
        correlationId?: string
    ): Logger {
        return new Logger(
            {
                loggerCallback: this.lcb,
                piiLoggingEnabled: this.piiEnabled,
                logLevel: this.lvl,
                correlationId: correlationId || this.cId,
            },
            packageName,
            packageVersion
        );
    }

    /**
     * Log message with required options.
     */
    private logMessage(
        logMessage: string,
        options: LoggerMessageOptions
    ): void {
        if (
            options.logLevel > this.lvl ||
            (!this.piiEnabled && options.containsPii)
        ) {
            return;
        }
        const timestamp = new Date().toUTCString();

        // Add correlationId to logs if set, correlationId provided on log messages take precedence
        const logHeader = `[${timestamp}] : [${
            options.correlationId || this.cId || ""
        }]`;

        const log = `${logHeader} : ${this.pkgName}@${
            this.pkgVer
        } : ${LogLevel[options.logLevel]} - ${logMessage}`;
        // debug(`msal:${LogLevel[options.logLevel]}${options.containsPii ? "-Pii": Constants.""}${options.context ? `:${options.context}` : Constants.""}`)(logMessage);
        this.executeCallback(
            options.logLevel,
            log,
            options.containsPii || false
        );
    }

    /**
     * Execute callback with message.
     */
    executeCallback(
        level: LogLevel,
        message: string,
        containsPii: boolean
    ): void {
        if (this.lcb) {
            this.lcb(level, message, containsPii);
        }
    }

    /**
     * Logs error messages.
     */
    error(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Error,
            containsPii: false,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs error messages with PII.
     */
    errorPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Error,
            containsPii: true,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs warning messages.
     */
    warning(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Warning,
            containsPii: false,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs warning messages with PII.
     */
    warningPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Warning,
            containsPii: true,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs info messages.
     */
    info(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Info,
            containsPii: false,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs info messages with PII.
     */
    infoPii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Info,
            containsPii: true,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs verbose messages.
     */
    verbose(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Verbose,
            containsPii: false,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs verbose messages with PII.
     */
    verbosePii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Verbose,
            containsPii: true,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs trace messages.
     */
    trace(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Trace,
            containsPii: false,
            correlationId: correlationId || "",
        });
    }

    /**
     * Logs trace messages with PII.
     */
    tracePii(message: string, correlationId?: string): void {
        this.logMessage(message, {
            logLevel: LogLevel.Trace,
            containsPii: true,
            correlationId: correlationId || "",
        });
    }

    /**
     * Returns whether PII Logging is enabled or not.
     */
    isPiiLoggingEnabled(): boolean {
        return this.piiEnabled || false;
    }
}
