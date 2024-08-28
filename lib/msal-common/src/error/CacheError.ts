/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as CacheErrorCodes from "./CacheErrorCodes.js";
export { CacheErrorCodes };

export const CacheErrorMessages = {
    [CacheErrorCodes.cacheQuotaExceededErrorCode]:
        "Exceeded cache storage capacity.",
    [CacheErrorCodes.cacheUnknownErrorCode]:
        "Unexpected error occurred when using cache storage.",
};

/**
 * Error thrown when there is an error with the cache
 */
export class CacheError extends Error {
    /**
     * Short string denoting error
     */
    errorCode: string;

    /**
     * Detailed description of error
     */
    errorMessage: string;

    constructor(errorCode: string, errorMessage?: string) {
        const message =
            errorMessage ||
            (CacheErrorMessages[errorCode]
                ? CacheErrorMessages[errorCode]
                : CacheErrorMessages[CacheErrorCodes.cacheUnknownErrorCode]);

        super(`${errorCode}: ${message}`);
        Object.setPrototypeOf(this, CacheError.prototype);

        this.name = "CacheError";
        this.errorCode = errorCode;
        this.errorMessage = message;
    }
}
