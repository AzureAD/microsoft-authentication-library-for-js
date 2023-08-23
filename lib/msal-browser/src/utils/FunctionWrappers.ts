/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import {
    IPerformanceClient,
    Logger,
    PerformanceEvents,
} from "@azure/msal-common";

/**
 * The functions in this file are used to wrap functions with performance measurements and logging
 */

/**
 * Wraps a function with a performance measurement.
 * Usage: wrap(functionToCall, performanceClient, "EventName", "correlationId")(...argsToPassToFunction)
 * @param callback
 * @param telemetryClient
 * @param logger
 * @param eventName
 * @param correlationId
 * @param thisObject
 * @returns
 */
export const wrap = <T extends Array<any>, U>(
    callback: (...args: T) => U,
    telemetryClient: IPerformanceClient,
    logger: Logger,
    eventName: PerformanceEvents,
    correlationId?: string
) => {
    return (...args: T): U => {
        logger.trace(`Executing function ${eventName}`);
        const inProgressEvent = telemetryClient.startMeasurement(
            eventName,
            correlationId
        );
        telemetryClient.setPreQueueTime(eventName, correlationId);
        try {
            const result = callback(...args);
            inProgressEvent.end({
                success: true,
            });
            logger.trace(`Returning result from ${eventName}`);
            return result;
        } catch (e) {
            logger.trace(`Error occurred in ${eventName}`);
            inProgressEvent.end({
                success: false,
            });
            throw e;
        }
    };
};

/**
 * Wraps an async function with a performance measurement.
 * Usage: wrapAsync(functionToCall, performanceClient, "EventName", "correlationId")(...argsToPassToFunction)
 * @param callback
 * @param telemetryClient
 * @param eventName
 * @param correlationId
 * @param thisObject
 * @returns
 */
export const wrapAsync = <T extends Array<any>, U>(
    callback: (...args: T) => Promise<U>,
    telemetryClient: IPerformanceClient,
    logger: Logger,
    eventName: PerformanceEvents,
    correlationId?: string
) => {
    return (...args: T): Promise<U> => {
        logger.trace(`Executing function ${eventName}`);
        const inProgressEvent = telemetryClient.startMeasurement(
            eventName,
            correlationId
        );
        telemetryClient.setPreQueueTime(eventName, correlationId);
        return callback(...args)
            .then((response) => {
                logger.trace(`Returning result from ${eventName}`);
                inProgressEvent.end({
                    success: true,
                });
                return response;
            })
            .catch((e) => {
                logger.trace(`Error occurred in ${eventName}`);
                inProgressEvent.end({
                    success: false,
                });
                throw e;
            });
    };
};
