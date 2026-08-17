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
 * Folds a V2 error body into a single normalized V2ServerError. Two on-the-wire shapes exist,
 * modelled by V2HalErrorResponse and V2OAuthErrorResponse:
 *
 *   - Nested `/api` HAL error: `{ error: { code, message, innerError: { code }, ... } }`.
 *   - Flat OAuth error (token endpoint): `{ error, error_description, error_codes, ... }`.
 *
 * Returns `undefined` when the body carries no error, so the caller can treat that as success;
 * deciding WHEN a normalized error is a failure is left to the api-client. Values are still read
 * through the runtime guards below because the body originates from untyped JSON.
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

// Nested `/api` HAL error: code/message/innerError.code live under the `error` object.
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

// Flat OAuth error (token endpoint): fields are snake_case at the top level.
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
