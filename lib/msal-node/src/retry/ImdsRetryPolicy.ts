/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpStatus, Logger } from "@azure/msal-common";
import { BaseRetryPolicy } from "./BaseRetryPolicy.js";

const HTTP_STATUS_400_CODES_FOR_EXPONENTIAL_STRATEGY: Array<number> = [
    HttpStatus.NOT_FOUND,
    HttpStatus.REQUEST_TIMEOUT,
    HttpStatus.GONE,
    HttpStatus.TOO_MANY_REQUESTS,
];

export const HTTP_STATUS_GONE_RETRY_AFTER_MS: number = 10 * 1000; // 10 seconds

const EXPONENTIAL_STRATEGY_NUM_RETRIES = 3;
const LINEAR_STRATEGY_NUM_RETRIES = 7;

export class ImdsRetryPolicy extends BaseRetryPolicy {
    private maxRetries: number;

    constructor() {
        super();
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
        currentRetry: number,
        logger: Logger
    ): Promise<boolean> {
        if (this._isNewRequest) {
            this._isNewRequest = false;

            // calculate the maxRetries based on the status code, once per request
            this.maxRetries =
                httpStatusCode === HttpStatus.GONE
                    ? LINEAR_STRATEGY_NUM_RETRIES
                    : EXPONENTIAL_STRATEGY_NUM_RETRIES;
        }

        /**
         * (status code is one of the retriable 400 status code
         * or
         * status code is >= 500 and <= 599)
         * and
         * current count of retries is less than the max number of retries
         */
        if (
            (HTTP_STATUS_400_CODES_FOR_EXPONENTIAL_STRATEGY.includes(
                httpStatusCode
            ) ||
                (httpStatusCode >= HttpStatus.SERVER_ERROR_RANGE_START &&
                    httpStatusCode <= HttpStatus.SERVER_ERROR_RANGE_END &&
                    currentRetry < this.maxRetries)) &&
            currentRetry < this.maxRetries
        ) {
            const retryAfterDelay: number =
                httpStatusCode === HttpStatus.GONE
                    ? HTTP_STATUS_GONE_RETRY_AFTER_MS
                    : this.calculateExponentialDelay(currentRetry);

            logger.verbose(
                `Retrying request in ${retryAfterDelay}ms (retry attempt: ${
                    currentRetry + 1
                })`
            );

            // pause execution for the calculated delay
            await new Promise((resolve) => {
                return setTimeout(resolve, retryAfterDelay);
            });

            return true;
        }

        // if the status code is not retriable or max retries have been reached, do not retry
        return false;
    }
}
