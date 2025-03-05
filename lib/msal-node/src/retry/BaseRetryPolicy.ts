/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { IHttpRetryPolicy } from "./IHttpRetryPolicy.js";

/**
 * Abstract base class for implementing HTTP retry policies.
 * Classes that extend this base class must implement the `pauseForRetry` method.
 */
export abstract class BaseRetryPolicy implements IHttpRetryPolicy {
    /**
     * Pauses execution for a specified amount of time before retrying an HTTP request.
     *
     * @param httpStatusCode - The HTTP status code of the response.
     * @param currentRetry - The current retry attempt number.
     * @param retryAfterHeader - The value of the `retry-after` HTTP header, if present.
     * @returns A promise that resolves to a boolean indicating whether to retry the request.
     */
    abstract pauseForRetry(
        httpStatusCode: number,
        currentRetry: number,
        retryAfterHeader: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean>;

    /**
     * Calculates the number of milliseconds to sleep based on the `retry-after` HTTP header.
     *
     * @param retryHeader - The value of the `retry-after` HTTP header. This can be either a number of seconds
     *                      or an HTTP date string.
     * @returns The number of milliseconds to sleep before retrying the request. If the `retry-after` header is not
     *          present or cannot be parsed, returns 0.
     */
    protected retryAfterMillisecondsToSleep(
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
