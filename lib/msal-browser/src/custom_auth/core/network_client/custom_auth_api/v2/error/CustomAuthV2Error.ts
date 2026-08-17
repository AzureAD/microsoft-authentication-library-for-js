/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Base type for every error that can back a native auth V2 {@link AuthFlowErrorV2Base}.
 * It carries the diagnostic fields the flow-error detectors read (`code`,
 * `innerErrorCode`, `errorCodes`, `message`) so the same detectors work whether
 * the failure came from the server ({@link CustomAuthV2ApiError}), from a
 * client-side validation ({@link InvalidInputError}), or from an unanticipated throw
 * ({@link UnexpectedError}). Only `code` is required; the remaining fields
 * are populated for server errors and left undefined otherwise.
 */
export class CustomAuthV2Error extends Error {
    readonly code: string;

    readonly innerErrorCode?: string;

    readonly errorCodes?: Array<number>;

    readonly correlationId?: string;

    readonly traceId?: string;

    readonly timestamp?: string;

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
        this.code = code;
        this.innerErrorCode = options?.innerErrorCode;
        this.errorCodes = options?.errorCodes;
        this.correlationId = options?.correlationId;
        this.traceId = options?.traceId;
        this.timestamp = options?.timestamp;
        Object.setPrototypeOf(this, CustomAuthV2Error.prototype);
    }
}
