/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The raw error payload returned by the native auth V2 server.
 *
 * The V2 API uses a different error shape than V1, so this is a dedicated type
 * (it does not reuse the V1 `CustomAuthError`).
 *
 * **Primary shape — `/api` endpoints (nested):**
 * `{ error: { code, message, timestamp, traceId, correlationId, innerError: { code } } }`.
 * This is the genuine per-step failure (steps 2-6), classified via `code` +
 * `innerError.code` (for example `invalidGrant` + `invalidOneTimeCode`).
 *
 * **Secondary shape — OAuth endpoints (flat):**
 * `{ error, error_description, error_codes, timestamp, trace_id, correlation_id }`.
 * Used only for genuine OAuth-endpoint failures (for example the `/token`
 * exchange). NOTE: the entry `401 insufficient_authorization` from
 * `authorize-challenge` is NOT a failure — it is the expected entry response
 * carrying the `continuation_token` + flow links, and is handled on the success
 * path (mirrors iOS, which serializes that `401` into a continuation-token
 * outcome rather than an error). It is therefore never surfaced as this type.
 *
 * A native auth V2 error (see `AuthFlowErrorV2Base`) wraps an instance of this
 * type as its `errorData` and reads these fields to classify the failure.
 */
export class CustomAuthV2ApiError extends Error {
    /**
     * The top-level server error code (for example "invalidGrant" or
     * "insufficient_authorization").
     */
    readonly code: string;

    /**
     * The nested `innerError.code` when present (for example "invalidOneTimeCode"),
     * used to classify the specific failure on `/api` endpoints.
     */
    readonly innerErrorCode?: string;

    /**
     * Numeric server error codes returned alongside the error.
     */
    readonly errorCodes?: Array<number>;

    /**
     * Correlation ID for the request, used for diagnostics and support.
     */
    readonly correlationId?: string;

    /**
     * Trace ID for the request, used for diagnostics.
     */
    readonly traceId?: string;

    /**
     * Server timestamp associated with the error.
     */
    readonly timestamp?: string;

    /**
     * Creates a new CustomAuthV2ApiError.
     * @param code - The top-level server error code.
     * @param message - A human-readable description of the error.
     * @param options - Optional additional error details.
     */
    constructor(
        code: string,
        message?: string,
        options?: {
            innerErrorCode?: string;
            errorCodes?: Array<number>;
            correlationId?: string;
            traceId?: string;
            timestamp?: string;
        }
    ) {
        super(message);
        this.name = "CustomAuthV2ApiError";
        this.code = code;
        this.innerErrorCode = options?.innerErrorCode;
        this.errorCodes = options?.errorCodes;
        this.correlationId = options?.correlationId;
        this.traceId = options?.traceId;
        this.timestamp = options?.timestamp;
    }
}
