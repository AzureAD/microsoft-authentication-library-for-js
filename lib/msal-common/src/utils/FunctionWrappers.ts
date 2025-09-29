/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "../logger/Logger.js";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient.js";

/**
 * Wraps a function with a performance measurement.
 * Usage: invoke(functionToCall, performanceClient, "EventName", "correlationId")(...argsToPassToFunction)
 * @param callback
 * @param eventName
 * @param logger
 * @param telemetryClient
 * @param correlationId
 * @returns
 * @internal
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invoke = <T extends Array<any>, U>(
    callback: (...args: T) => U,
    eventName: string,
    logger: Logger,
    telemetryClient?: IPerformanceClient,
    correlationId?: string
) => {
    return (...args: T): U => {
        logger.trace(`Executing function ${eventName}`);
        const inProgressEvent = telemetryClient?.startMeasurement(
            eventName,
            correlationId
        );
        if (correlationId) {
            // Track number of times this API is called in a single request
            const eventCount = eventName + "CallCount";
            telemetryClient?.incrementFields(
                { [eventCount]: 1 },
                correlationId
            );
        }
        try {
            const result = callback(...args);
            inProgressEvent?.end({
                success: true,
            });
            logger.trace(`Returning result from ${eventName}`);
            return result;
        } catch (e) {
            logger.trace(`Error occurred in ${eventName}`);
            try {
                logger.trace(JSON.stringify(e));
            } catch (e) {
                logger.trace("Unable to print error message.");
            }
            inProgressEvent?.end(
                {
                    success: false,
                },
                e
            );
            throw e;
        }
    };
};

/**
 * Wraps an async function with a performance measurement.
 * Usage: invokeAsync(functionToCall, performanceClient, "EventName", "correlationId")(...argsToPassToFunction)
 * @param callback
 * @param eventName
 * @param logger
 * @param telemetryClient
 * @param correlationId
 * @returns
 * @internal
 *
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invokeAsync = <T extends Array<any>, U>(
    callback: (...args: T) => Promise<U>,
    eventName: string,
    logger: Logger,
    telemetryClient?: IPerformanceClient,
    correlationId?: string
) => {
    return (...args: T): Promise<U> => {
        logger.trace(`Executing function ${eventName}`);
        const inProgressEvent = telemetryClient?.startMeasurement(
            eventName,
            correlationId
        );
        if (correlationId) {
            // Track number of times this API is called in a single request
            const eventCount = eventName + "CallCount";
            telemetryClient?.incrementFields(
                { [eventCount]: 1 },
                correlationId
            );
        }
        telemetryClient?.setPreQueueTime(eventName, correlationId);
        return callback(...args)
            .then((response) => {
                logger.trace(`Returning result from ${eventName}`);
                inProgressEvent?.end({
                    success: true,
                });
                return response;
            })
            .catch((e) => {
                logger.trace(`Error occurred in ${eventName}`);

                const isPiiEnabled = logger.isPiiLoggingEnabled();

                const logMethod = isPiiEnabled
                    ? logger.errorPii.bind(logger)
                    : logger.error.bind(logger);

                logger.error(`Network request failed for ${eventName}:`);

                const errorType =
                    e && typeof e === "object" && e.constructor
                        ? e.constructor.name
                        : typeof e;
                logger.error(`Error type: ${errorType}`);

                const errorCode =
                    e && typeof e === "object" && typeof e.code === "string"
                        ? e.code
                        : "unknown";
                logger.error(`Error code: ${errorCode}`);

                const errorMessage =
                    e && typeof e === "object" && typeof e.message === "string"
                        ? e.message
                        : "No message provided";
                logger.error(`Error message: ${errorMessage}`);

                if (
                    e &&
                    typeof e === "object" &&
                    e.response &&
                    typeof e.response === "object"
                ) {
                    const status =
                        typeof e.response.status === "number" ||
                        typeof e.response.status === "string"
                            ? e.response.status
                            : "unknown";
                    logger.error(`HTTP Status: ${status}`);

                    if (
                        e.response.headers &&
                        typeof e.response.headers === "object"
                    ) {
                        logHeadersWithPiiAwareness(
                            logMethod,
                            logger,
                            isPiiEnabled,
                            e.response.headers,
                            "Response headers"
                        );
                    }
                }

                if (
                    e &&
                    typeof e === "object" &&
                    e.config &&
                    typeof e.config === "object"
                ) {
                    if (typeof e.config.url === "string") {
                        logUrlWithPiiAwareness(
                            logMethod,
                            isPiiEnabled,
                            e.config.url,
                            "Request URL"
                        );
                    }

                    const method =
                        typeof e.config.method === "string"
                            ? e.config.method.toUpperCase()
                            : "unknown";
                    logger.error(`Request method: ${method}`);

                    const timeout =
                        typeof e.config.timeout === "number"
                            ? `${e.config.timeout}ms`
                            : "not set";
                    logger.error(`Request timeout: ${timeout}`);
                }

                // Network-specific diagnostics with safe code checking
                const networkErrorCodes = [
                    "ECONNRESET",
                    "ENOTFOUND",
                    "ETIMEDOUT",
                    "ECONNREFUSED",
                    "EHOSTUNREACH",
                ];
                if (
                    typeof errorCode === "string" &&
                    networkErrorCodes.includes(errorCode)
                ) {
                    logger.error(
                        `Network connectivity issue detected: ${errorCode}`
                    );
                }

                try {
                    logger.trace(JSON.stringify(e));
                } catch (e) {
                    logger.trace("Unable to print error message.");
                }
                inProgressEvent?.end(
                    {
                        success: false,
                    },
                    e
                );
                throw e;
            });
    };
};

/**
 * Helper function to log URLs with PII-aware sanitization using pre-bound method
 * @param logMethod {(message: string) => void} the pre-bound logger method
 * @param isPiiEnabled {boolean} whether PII logging is enabled
 * @param urlString {string} the URL to log
 * @param label {string} the label for the log message
 */
const logUrlWithPiiAwareness = (
    logMethod: (message: string) => void,
    isPiiEnabled: boolean,
    urlString: string,
    label: string
): void => {
    let urlHelper;
    if (isPiiEnabled) {
        urlHelper = urlString;
    } else {
        try {
            const url = new URL(urlString);
            urlHelper = `${url.protocol}//${url.host}${url.pathname}`;
        } catch {
            urlHelper = urlString.split("?")[0] || "unknown";
        }
    }

    logMethod(`${label}: ${urlHelper}`);
};

/**
 * Helper function to log headers with PII awareness using pre-bound method and standard logger
 * @param logMethod {(message: string) => void} the pre-bound logger method
 * @param standardLogger {Logger} the logger instance for standard (non-PII) logging
 * @param isPiiEnabled {boolean} whether PII logging is enabled
 * @param headers {Record<string, unknown>} the headers to log
 * @param label {string} the label for the log message
 */
const logHeadersWithPiiAwareness = (
    logMethod: (message: string) => void,
    standardLogger: Logger,
    isPiiEnabled: boolean,
    headers: Record<string, unknown>,
    label: string
): void => {
    if (isPiiEnabled) {
        logMethod(`${label}: ${JSON.stringify(headers)}`);
    } else {
        standardLogger.error(
            `${label}: [REDACTED - Enable PII logging to see headers]`
        );
    }
};
