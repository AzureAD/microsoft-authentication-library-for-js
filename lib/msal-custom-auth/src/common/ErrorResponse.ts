/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface ErrorResponse {
    error: string;
    error_description: string;
    error_codes: number[];
    timestamp: string;
    trace_id: string;
    correlation_id: string;
}
