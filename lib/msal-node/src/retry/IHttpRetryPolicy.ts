/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";

export interface IHttpRetryPolicy {
    /**
     * Pauses execution for a specified amount of time before retrying an HTTP request.
     *
     * @param httpStatusCode - The HTTP status code of the response.
     * @param currentRetry - The current retry attempt number.
     * @param retryAfterHeader - The value of the `retry-after` HTTP header, if present.
     * @returns A promise that resolves to a boolean indicating whether to retry the request.
     */
    pauseForRetry(
        httpStatusCode: number,
        currentRetry: number,
        retryAfterHeader: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean>;
}
