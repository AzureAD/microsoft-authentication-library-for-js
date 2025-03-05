/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { BaseRetryPolicy } from "./BaseRetryPolicy.js";

export class ExponentialRetryPolicy extends BaseRetryPolicy {
    maxRetries: number;
    minBackoff: number;
    maxBackoff: number;
    deltaBackoff: number;
    httpStatusCodesToRetryOn: Array<number>;

    // TODO: Remove this. This is specifically for the IMDS retry policy.
    /*
     * maxRetries: number = 5,
     * minBackoff: number = 0,
     * maxBackoff: number = 60000, // 60 sec
     * deltaBackoff: number = 2000, // 2 sec
     * httpStatusCodesToRetryOn: Array<number> = [404, 429] // -- only exponential retry on 404 and 429 ??? Linear retry on other IMDS error status codes?
     */

    constructor(
        maxRetries: number,
        minBackoff: number,
        maxBackoff: number,
        deltaBackoff: number,
        httpStatusCodesToRetryOn: Array<number>
    ) {
        super();

        this.maxRetries = maxRetries;
        this.minBackoff = minBackoff;
        this.maxBackoff = maxBackoff;
        this.deltaBackoff = deltaBackoff;
        this.httpStatusCodesToRetryOn = httpStatusCodesToRetryOn;
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
    private calculateExponentialDelay(currentRetry: number): number {
        if (currentRetry === 0) {
            return this.minBackoff;
        }

        /*
         * Attempt 1 - delay ~2 sec
         * Attempt 2 - delay ~4 sec
         * Attempt 3 - delay ~8 sec
         * Attempt 4 - delay ~16 sec
         * Attempt 5 - delay ~32 sec
         */
        const exponentialDelay = Math.min(
            Math.pow(2, currentRetry - 1) * this.deltaBackoff,
            this.maxBackoff
        );

        return exponentialDelay;
    }

    /**
     * Pauses execution for a calculated delay before retrying a request.
     *
     * @param httpStatusCode - The HTTP status code of the response.
     * @param currentRetry - The current retry attempt number.
     * @param retryAfterHeader - The value of the "retry-after" header from the response.
     * @returns A promise that resolves to a boolean indicating whether a retry should be attempted.
     */
    async pauseForRetry(
        httpStatusCode: number,
        currentRetry: number
        // retryAfterHeader: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean> {
        // Check if the status code is one of the retriable status codes and if the current retry count is less than the max retries
        if (
            this.httpStatusCodesToRetryOn.includes(httpStatusCode) &&
            currentRetry < this.maxRetries
        ) {
            /*
             * Calculate the delay based on the "retry-after" header if present, otherwise use the exponential backoff delay
             * const retryAfterDelay: number =
             *     this.retryAfterMillisecondsToSleep(retryAfterHeader);
             */

            const exponentialDelay =
                this.calculateExponentialDelay(currentRetry);

            // Pause execution for the calculated delay
            await new Promise((resolve) => {
                return setTimeout(
                    resolve,
                    /* retryAfterDelay ||*/ exponentialDelay
                );
            });

            return true;
        }

        // If the status code is not retriable or max retries have been reached, do not retry
        return false;
    }
}
