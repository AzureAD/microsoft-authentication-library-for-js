/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { Logger } from "@azure/msal-common";
import { IHttpRetryPolicy } from "./IHttpRetryPolicy.js";

/**
 * Abstract base class for implementing HTTP retry policies.
 * Classes that extend this base class must implement the `pauseForRetry` method.
 */
export abstract class BaseRetryPolicy implements IHttpRetryPolicy {
    // Minimum backoff time in milliseconds. Can be overridden in derived classes.
    protected minExponentialBackoff: number = 1000; // Default to 1 second
    // Maximum backoff time in milliseconds. Can be overridden in derived classes.
    protected maxExponentialBackoff: number = 4000; // Default to 4 seconds
    // Maximum backoff time in milliseconds. Can be overridden in derived classes.
    protected exponentialDeltaBackoff: number = 2000; // Default to 2 seconds

    _isNewRequest: boolean;
    set isNewRequest(value: boolean) {
        this._isNewRequest = value;
    }

    abstract pauseForRetry(
        httpStatusCode: number,
        currentRetry: number,
        logger: Logger,
        retryAfterHeader?: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean>;

    /**
     * Calculates the number of milliseconds to sleep based on the `retry-after` HTTP header.
     *
     * @param retryHeader - The value of the `retry-after` HTTP header. This can be either a number of seconds
     *                      or an HTTP date string.
     * @returns The number of milliseconds to sleep before retrying the request. If the `retry-after` header is not
     *          present or cannot be parsed, returns 0.
     */
    protected calculateLinearDelay(
        retryHeader: http.IncomingHttpHeaders["retry-after"]
    ): number {
        if (!retryHeader) {
            return 0;
        }

        // retry-after header is in seconds
        let millisToSleep = Math.round(parseFloat(retryHeader) * 1000);

        /*
         * retry-after header is in HTTP Date format
         * <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
         */
        if (isNaN(millisToSleep)) {
            millisToSleep = Math.max(
                0,
                // .valueOf() is needed to subtract dates in TypeScript
                new Date(retryHeader).valueOf() - new Date().valueOf()
            );
        }

        return millisToSleep;
    }

    /**
     * Calculates the exponential delay based on the current retry attempt.
     *
     * @param {number} currentRetry - The current retry attempt number.
     * @returns {number} - The calculated exponential delay in milliseconds.
     *
     * The delay is calculated using the formula:
     * - If `currentRetry` is 0, it returns the minimum backoff time.
     * - Otherwise, it calculates the delay as the minimum of:
     *   - `(2^(currentRetry - 1)) * deltaBackoff`
     *   - `maxBackoff`
     *
     * This ensures that the delay increases exponentially with each retry attempt,
     * but does not exceed the maximum backoff time.
     */
    protected calculateExponentialDelay(currentRetry: number): number {
        // Attempt 1 - delay ~1 sec
        if (currentRetry === 0) {
            return this.minExponentialBackoff;
        }

        /*
         * Attempt 2 - delay ~2 sec
         * Attempt 3 - delay ~4 sec
         */
        const exponentialDelay = Math.min(
            Math.pow(2, currentRetry - 1) * this.exponentialDeltaBackoff,
            this.maxExponentialBackoff
        );

        return exponentialDelay;
    }
}
