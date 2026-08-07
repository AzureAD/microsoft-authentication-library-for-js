/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * HAL resource endpoints (steps 2-6) — nested error shape; `innerError.code`
 * disambiguates the user-facing cause (e.g. invalidOneTimeCode).
 */
export interface V2ApiErrorResponse {
    error?: {
        code?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        correlationId?: string;
        innerError?: {
            code?: string;
        };
    };
}
