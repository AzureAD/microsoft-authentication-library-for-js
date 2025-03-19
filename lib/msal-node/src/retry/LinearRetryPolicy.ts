/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { Logger } from "@azure/msal-common";
import { BaseRetryPolicy } from "./BaseRetryPolicy.js";

export class LinearRetryPolicy extends BaseRetryPolicy {
    maxRetries: number;
    retryDelay: number;
    httpStatusCodesToRetryOn: Array<number>;

    constructor(
        maxRetries: number,
        retryDelay: number,
        httpStatusCodesToRetryOn: Array<number>
    ) {
        super();

        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.httpStatusCodesToRetryOn = httpStatusCodesToRetryOn;
    }

    async pauseForRetry(
        httpStatusCode: number,
        currentRetry: number,
        logger: Logger,
        retryAfterHeader: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean> {
        if (
            this.httpStatusCodesToRetryOn.includes(httpStatusCode) &&
            currentRetry < this.maxRetries
        ) {
            const retryAfterDelay: number =
                this.calculateLinearDelay(retryAfterHeader);

            logger.verbose(
                `Retrying request in ${retryAfterDelay}ms (retry attempt: ${
                    currentRetry + 1
                })`
            );

            // pause execution for the calculated delay
            await new Promise((resolve) => {
                // retryAfterHeader value of 0 evaluates to false, and this.retryDelay will be used
                return setTimeout(resolve, retryAfterDelay || this.retryDelay);
            });

            return true;
        }

        // if the status code is not retriable or max retries have been reached, do not retry
        return false;
    }
}
