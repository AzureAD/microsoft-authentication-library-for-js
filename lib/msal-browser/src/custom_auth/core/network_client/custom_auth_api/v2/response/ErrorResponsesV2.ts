/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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

export interface OAuthErrorResponseV2 {
    error?: string;
    error_description?: string;
    error_codes?: number[];
    suberror?: string;
    timestamp?: string;
    trace_id?: string;
    correlation_id?: string;
}

export interface ServerErrorV2 {
    code: string;
    message?: string;
    innerErrorCode?: string;
    subError?: string;
    errorCodes?: number[];
    correlationId?: string;
    traceId?: string;
    timestamp?: string;
    attributeValidationDetails?: AttributeValidationDetailV2[];
}
