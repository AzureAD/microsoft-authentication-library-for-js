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
 * Represents a single logged message with metadata
 */
export interface LoggedMessage {
    hash: string;
    level: LogLevel;
    containsPii: boolean;
    timestamp: number;
}

/**
 * LRU cache node for correlation ID management
 */
interface CorrelationLogData {
    logs: LoggedMessage[];
}

// Shared cache state for better minification - using Map's insertion order for LRU
const CACHE_CAPACITY = 3;
const MAX_LOGS_PER_CORRELATION = 1000;
const correlationCache = new Map<string, CorrelationLogData>();

/**
 * Mark correlation ID as recently used by moving it to end of Map
 */
function markAsRecentlyUsed(correlationId: string, data: CorrelationLogData): void {
    correlationCache.delete(correlationId);
    correlationCache.set(correlationId, data);
}

/**
 * Add log message to cache for specific correlation ID
 */
function addLogToCache(correlationId: string, loggedMessage: LoggedMessage): void {
    const normalizedCorrelationId = correlationId || "default";

    let data = correlationCache.get(normalizedCorrelationId);

    if (data) {
        // Mark as recently used
        markAsRecentlyUsed(normalizedCorrelationId, data);
    } else {
        // Create new entry
        data = { logs: [] };
        correlationCache.set(normalizedCorrelationId, data);

        // Remove LRU (first entry) if capacity exceeded
        if (correlationCache.size > CACHE_CAPACITY) {
            const firstKey = correlationCache.keys().next().value;
            if (firstKey) {
                correlationCache.delete(firstKey);
            }
        }
    }

    // Add log to the data, maintaining max logs per correlation
    data.logs.push(loggedMessage);
    if (data.logs.length > MAX_LOGS_PER_CORRELATION) {
        data.logs.shift(); // Remove oldest log
    }
}

/**
 * Get all logs for specific correlation ID
 */
function getLogsFromCache(correlationId: string): LoggedMessage[] {
    const normalizedCorrelationId = correlationId || "default";
    const data = correlationCache.get(normalizedCorrelationId);
    if (data) {
        markAsRecentlyUsed(normalizedCorrelationId, data);
        return [...data.logs]; // Return copy
    }
    return [];
}

/**
 * Get logs for correlation ID and flush them from cache
 */
function getAndFlushLogsFromCache(correlationId: string): LoggedMessage[] {
    const normalizedCorrelationId = correlationId || "default";
    const data = correlationCache.get(normalizedCorrelationId);
    if (data) {
        const logs = [...data.logs];
        data.logs = []; // Clear the logs
        return logs;
    }
    return [];
}

/**
 * Get all correlation IDs that have logs
 */
function getCachedCorrelationIds(): string[] {
    return Array.from(correlationCache.keys());
}

/**
 * Creates a consistent 6-char hash for a given string
 */
function createStringHash(str: string) {
    const cyrb64 = (str: string, seed = 0) => {
        let h1 = 0xdeadbeef ^ seed,
            h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        return [h2 >>> 0, h1 >>> 0];
    }

    const cyrb64Hash = (str: string, seed = 0) => {
        const [h2, h1] = cyrb64(str, seed);
        return h2.toString(36).padStart(7, "0") + h1.toString(36).padStart(7, "0");
    }

    return cyrb64Hash(str).substring(0, 6);
}

/**
 * Checks if a string is already a hashed logging string (8 hex characters)
 */
function isHashedString(str: string): boolean {
    return /^[a-f0-9]{8}$/i.test(str);
}

/**
 * Normalizes a message for consistent hashing between minified and runtime versions
 */
function normalizeMessageForHashing(message: string): string {
    // Handle template literals with variable normalization
    return message.replace(/\$\{[^}]*\}/g, (match) => {
        const content = match.slice(2, -1).trim();
        // Simple variable vs complex expression
        if (/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(content)) {
            return '${VAR}';
        } else {
            return '${EXPR}';
        }
    });
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
        this.localCallback =
            setLoggerOptions.loggerCallback || defaultLoggerCallback;
        this.piiLoggingEnabled = setLoggerOptions.piiLoggingEnabled || false;
        this.level =
            typeof setLoggerOptions.logLevel === "number"
                ? setLoggerOptions.logLevel
                : LogLevel.Info;
        this.correlationId = setLoggerOptions.correlationId || "";
        this.packageName = packageName || "";
        this.packageVersion = packageVersion || "";
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
                loggerCallback: this.localCallback,
                piiLoggingEnabled: this.piiLoggingEnabled,
                logLevel: this.level,
                correlationId: correlationId || this.correlationId,
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
            options.logLevel > this.level ||
            (!this.piiLoggingEnabled && options.containsPii)
        ) {
            return;
        }
        const timestamp = new Date().toUTCString();
        const correlationId = options.correlationId || this.correlationId || "";

        // Add correlationId to logs if set, correlationId provided on log messages take precedence
        const logHeader = `[${timestamp}] : [${correlationId}]`;

        const log = `${logHeader} : ${this.packageName}@${
            this.packageVersion
        } : ${LogLevel[options.logLevel]} - ${logMessage}`;

        /*
         * Input is already a hashed string (from minified version) OR
         * Input is a regular string, need to hash it
         */
        const hash: string = isHashedString(logMessage) ? logMessage : createStringHash(normalizeMessageForHashing(logMessage));

        const loggedMessage: LoggedMessage = {
            hash,
            level: options.logLevel,
            containsPii: options.containsPii || false,
            timestamp: Date.now()
        };

        addLogToCache(correlationId, loggedMessage);

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
        if (this.localCallback) {
            this.localCallback(level, message, containsPii);
        }
    }

    /**
     * Get cached logs for a specific correlation ID
     */
    public getCachedLogHashes(correlationId?: string): LoggedMessage[] {
        return getLogsFromCache(correlationId || "");
    }

    /**
     * Get cached logs for a correlation ID and flush them from cache
     */
    public getCachedLogHashesAndFlush(correlationId?: string): LoggedMessage[] {
        return getAndFlushLogsFromCache(correlationId || "");
    }

    /**
     * Get all correlation IDs that have cached logs
     */
    public getCachedCorrelationIds(): string[] {
        return getCachedCorrelationIds();
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
        return this.piiLoggingEnabled || false;
    }
}
