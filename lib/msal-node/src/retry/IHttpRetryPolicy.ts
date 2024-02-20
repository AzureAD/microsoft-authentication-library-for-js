/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface IHttpRetryPolicy {
    /*
     * if retry conditions occur, pauses and returns true
     * otherwise return false
     */
    pauseForRetry(
        status: number,
        currentRetry: number,
        retryAfterHeader: number
    ): Promise<boolean>;
}
