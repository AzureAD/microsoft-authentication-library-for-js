/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseRetryPolicy } from "./BaseRetryPolicy.js";

const IMDS_UNDERGOING_UPDATES_STATUS_CODE: number = 410;
const IMDS_410_RETRY_AFTER_MS: number = 10 * 1000; // 10 seconds

export class ExponentialRetryPolicy extends BaseRetryPolicy {
    private maxRetries: number;
    private httpStatusCodesToExponentialRetryOn: Array<number> = [
        404, 408, 429,
    ]; // additionally, any 5xx status code

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
        currentRetry: number
    ): Promise<boolean> {
        if (this._isNewRequest) {
            this._isNewRequest = false;

            // calculate the maxRetries based on the status code, once per request
            this.maxRetries =
                httpStatusCode === IMDS_UNDERGOING_UPDATES_STATUS_CODE ? 7 : 3;
        }

        if (
            this.httpStatusCodesToExponentialRetryOn.includes(httpStatusCode) &&
            httpStatusCode >= 500 &&
            httpStatusCode < 600 &&
            currentRetry < this.maxRetries
        ) {
            let delay: number;
            if (httpStatusCode === IMDS_UNDERGOING_UPDATES_STATUS_CODE) {
                delay = IMDS_410_RETRY_AFTER_MS;
            } else {
                delay = this.calculateExponentialDelay(currentRetry);
            }

            // pause execution for the calculated delay
            await new Promise((resolve) => {
                return setTimeout(resolve, delay);
            });

            return true;
        }

        // if the status code is not retriable or max retries have been reached, do not retry
        return false;
    }
}
