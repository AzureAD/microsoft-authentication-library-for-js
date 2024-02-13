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
        currentRetry: number
    ): Promise<boolean> {
        if (
            this.httpStatusCodesToRetryOn.includes(status) &&
            currentRetry < this.maxRetries
        ) {
            await new Promise((resolve) =>
                setTimeout(resolve, this.retryDelay)
            );
            return true;
        }

        return false;
    }
}
