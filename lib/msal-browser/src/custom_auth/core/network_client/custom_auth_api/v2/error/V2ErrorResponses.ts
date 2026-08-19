/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Nested error shape returned by the HAL `/api` resource endpoints.
export interface V2HalErrorResponse {
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

// Flat error shape returned by the OAuth endpoints (authorize-challenge entry and token).
export interface V2OAuthErrorResponse {
    error?: string;
    error_description?: string;
    error_codes?: number[];
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
}

/*
 * Normalized server error folded from either wire shape (flat OAuth or nested HAL) into one
 * struct. The serializer produces it on the envelope so the api-client stays shape-agnostic.
 */
export interface V2ServerError {
    code: string;
    message?: string;
    innerErrorCode?: string;
    errorCodes?: number[];
    correlationId?: string;
    traceId?: string;
    timestamp?: string;
}
