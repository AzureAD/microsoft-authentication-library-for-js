/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    V2HalErrorResponse,
    V2OAuthErrorResponse,
    V2ServerError,
} from "./V2ErrorResponses.js";
import { UNEXPECTED_ERROR } from "./V2ErrorCodes.js";

/*
 * Normalizes nested HAL and flat OAuth error bodies into a `V2ServerError`.
 * Returns `undefined` when the response contains no recognized error.
 */
export function normalizeError(
    body: Record<string, unknown>
): V2ServerError | undefined {
    const error = body.error;

    if (error && typeof error === "object") {
        return normalizeNestedError(body as V2HalErrorResponse);
    }

    if (typeof error === "string") {
        return normalizeFlatError(body as V2OAuthErrorResponse);
    }

    return undefined;
}

function normalizeNestedError(response: V2HalErrorResponse): V2ServerError {
    const error = response.error ?? {};

    return {
        code: readString(error.code) ?? UNEXPECTED_ERROR,
        message: readString(error.message),
        innerErrorCode: readString(error.innerError?.code),
        correlationId: readString(error.correlationId),
        traceId: readString(error.traceId),
        timestamp: readString(error.timestamp),
    };
}

function normalizeFlatError(response: V2OAuthErrorResponse): V2ServerError {
    return {
        code: readString(response.error) ?? UNEXPECTED_ERROR,
        message: readString(response.error_description),
        errorCodes: readNumberArray(response.error_codes),
        correlationId: readString(response.correlation_id),
        traceId: readString(response.trace_id),
        timestamp: readString(response.timestamp),
    };
}

function readString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function readNumberArray(value: unknown): number[] | undefined {
    if (Array.isArray(value) && value.every((v) => typeof v === "number")) {
        return value as number[];
    }

    return undefined;
}
