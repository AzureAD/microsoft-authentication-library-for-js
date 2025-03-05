/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
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
        retryAfterHeader: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean> {
        if (
            this.httpStatusCodesToRetryOn.includes(httpStatusCode) &&
            currentRetry < this.maxRetries
        ) {
            const retryAfterDelay: number =
                this.retryAfterMillisecondsToSleep(retryAfterHeader);

            await new Promise((resolve) => {
                // retryAfterHeader value of 0 evaluates to false, and this.retryDelay will be used
                return setTimeout(resolve, retryAfterDelay || this.retryDelay);
            });

            return true;
        }

        return false;
    }
}
