/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IHttpRetryPolicy } from "./IHttpRetryPolicy";

export class LinearRetryPolicy implements IHttpRetryPolicy {
    maxRetries: number;
    retryDelay: number;
    httpStatusCodesToRetryOn: Array<number>;

    constructor(
        maxRetries: number,
        retryDelay: number,
        httpStatusCodesToRetryOn: Array<number>
    ) {
        this.maxRetries = maxRetries;
        this.retryDelay = retryDelay;
        this.httpStatusCodesToRetryOn = httpStatusCodesToRetryOn;
    }

    async pauseForRetry(
        status: number,
        currentRetry: number,
        retryAfterHeader: number
    ): Promise<boolean> {
        if (
            this.httpStatusCodesToRetryOn.includes(status) &&
            currentRetry < this.maxRetries
        ) {
            await new Promise((resolve) => {
                // retryAfterHeader value of 0 evaluates to false, and this.retryDelay will be used
                return setTimeout(resolve, retryAfterHeader || this.retryDelay);
            });

            return true;
        }

        return false;
    }
}
