/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common";

export class RetryTracker {
    private logger: Logger;
    private retryLimit: number;
    private retryWaitTimeMilli: number;

    private _numRetried: number;
    public resetNumRetried(): void {
        this._numRetried = 0;
    }

    constructor(
        logger: Logger,
        retryLimit: number,
        retryWaitTimeMilli: number
    ) {
        this.logger = logger;
        this.retryLimit = retryLimit;
        this.retryWaitTimeMilli = retryWaitTimeMilli;
        this._numRetried = 0;
    }

    // HeaderNames.RETRY_AFTER
    public async retry(
        statusCode: number,
        retryAfterHeader: string | undefined
    ): Promise<boolean> {
        if (this._numRetried === this.retryLimit) {
            this.logger.warning(
                "The request can not be retried because it has already been retried the maximum number of times."
            );
            return false;
        }

        if (!retryAfterHeader) {
            this.logger.warning(
                "The request can not be retried because the original network response contains the Retry-After header."
            );
            return false;
        }

        let retriableStatusCode: boolean = false;
        switch (statusCode) {
            case 404: // Not Found
            case 408: // Request Timeout
            case 429: // Too Many Requests
            case 500: // Internal Server Error
            case 503: // Service Unavailable
            case 504: // Gateway Timeout
                retriableStatusCode = true;
        }
        if (!retriableStatusCode) {
            this.logger.warning(
                "The request can not be retried because the status code of the original network reponse is not retriable."
            );
            return false;
        }

        // wait for user-specified time in milliseconds
        await new Promise((resolve) =>
            setTimeout(resolve, this.retryWaitTimeMilli)
        );

        this._numRetried += 1;

        return true;
    }
}
