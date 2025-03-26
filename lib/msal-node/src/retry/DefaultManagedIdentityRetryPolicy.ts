/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import http from "http";
import { Logger } from "@azure/msal-common";
import { IHttpRetryPolicy } from "./IHttpRetryPolicy.js";
import { LinearRetryStrategy } from "./LinearRetryStrategy.js";
import {
    DEFAULT_MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON,
    DEFAULT_MANAGED_IDENTITY_MAX_RETRIES,
    DEFAULT_MANAGED_IDENTITY_RETRY_DELAY,
} from "../utils/Constants.js";

export class DefaultManagedIdentityRetryPolicy implements IHttpRetryPolicy {
    private linearRetryStrategy: LinearRetryStrategy =
        new LinearRetryStrategy();

    async pauseForRetry(
        httpStatusCode: number,
        currentRetry: number,
        logger: Logger,
        retryAfterHeader: http.IncomingHttpHeaders["retry-after"]
    ): Promise<boolean> {
        if (
            DEFAULT_MANAGED_IDENTITY_HTTP_STATUS_CODES_TO_RETRY_ON.includes(
                httpStatusCode
            ) &&
            currentRetry < DEFAULT_MANAGED_IDENTITY_MAX_RETRIES
        ) {
            const retryAfterDelay: number =
                this.linearRetryStrategy.calculateDelay(retryAfterHeader);

            logger.verbose(
                `Retrying request in ${retryAfterDelay}ms (retry attempt: ${
                    currentRetry + 1
                })`
            );

            // pause execution for the calculated delay
            await new Promise((resolve) => {
                // retryAfterHeader value of 0 evaluates to false, and DEFAULT_MANAGED_IDENTITY_RETRY_DELAY will be used
                return setTimeout(
                    resolve,
                    retryAfterDelay || DEFAULT_MANAGED_IDENTITY_RETRY_DELAY
                );
            });

            return true;
        }

        // if the status code is not retriable or max retries have been reached, do not retry
        return false;
    }
}
