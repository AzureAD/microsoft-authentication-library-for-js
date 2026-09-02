/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Nested error shape returned by the HAL `/api` resource endpoints.
export interface AttributeValidationDetailV2 {
    attributeIds?: string[];
    code?: string;
    message?: string;
}

export interface HalErrorResponseV2 {
    error?: {
        code?: string;
        message?: string;
        timestamp?: string;
        traceId?: string;
        correlationId?: string;
        innerError?: {
            code?: string;
            details?: AttributeValidationDetailV2[];
        };
    };
}

// Flat error shape returned by the OAuth endpoints (authorize-challenge entry and token).
export interface OAuthErrorResponseV2 {
    error?: string;
    error_description?: string;
    error_codes?: number[];
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
}

/*
 * Normalized server error folded from either wire shape (flat OAuth or nested HAL) into one
 * struct. Response parsing adds it to the envelope so the api-client stays shape-agnostic.
 */
export interface ServerErrorV2 {
    code: string;
    message?: string;
    innerErrorCode?: string;
    errorCodes?: number[];
    correlationId?: string;
    traceId?: string;
    timestamp?: string;
    attributeValidationDetails?: AttributeValidationDetailV2[];
}
