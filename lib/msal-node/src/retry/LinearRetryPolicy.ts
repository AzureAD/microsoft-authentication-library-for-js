/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { IHttpRetryPolicy } from "./IHttpRetryPolicy";
import http from "http";

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

    retryAfterMillisecondsToSleep(
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
}
