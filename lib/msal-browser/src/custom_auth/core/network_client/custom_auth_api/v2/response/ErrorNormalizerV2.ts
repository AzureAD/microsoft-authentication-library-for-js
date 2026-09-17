/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    HalErrorResponseV2,
    OAuthErrorResponseV2,
    ServerErrorV2,
} from "./ErrorResponsesV2.js";
import { UNEXPECTED_ERROR } from "../ErrorCodesV2.js";

/*
 * Normalizes nested HAL and flat OAuth error bodies into a `ServerErrorV2`.
 * Returns `undefined` when the response contains no recognized error.
 */
export function normalizeServerErrorV2(
    body: Record<string, unknown>
): ServerErrorV2 | undefined {
    const error = body.error;

    if (error && typeof error === "object") {
        return normalizeHalError(body as HalErrorResponseV2);
    }

    if (typeof error === "string") {
        return normalizeOAuthError(body as OAuthErrorResponseV2);
    }

    return undefined;
}

function normalizeHalError(response: HalErrorResponseV2): ServerErrorV2 {
    const error = response.error ?? {};

    return {
        code: readString(error.code) ?? UNEXPECTED_ERROR,
        message: readString(error.message),
        innerErrorCode: readString(error.innerError?.code),
        attributeValidationDetails: error.innerError?.details,
        correlationId: readString(error.correlationId),
        traceId: readString(error.traceId),
        timestamp: readString(error.timestamp),
    };
}

function normalizeOAuthError(response: OAuthErrorResponseV2): ServerErrorV2 {
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
