/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * The raw error payload returned by the native auth V2 server, wrapped by an
 * {@link AuthFlowErrorV2Base} as its `errorData` to classify a failure. V2 uses
 * a dedicated shape (not the V1 `CustomAuthError`): a nested
 * `{ error: { code, innerError: { code } } }` on `/api` endpoints and a flat
 * OAuth shape on token endpoints. The entry `401 insufficient_authorization` is
 * not a failure and is never surfaced as this type — it is the expected
 * continuation-token entry response handled on the success path.
 */
export class CustomAuthV2ApiError extends Error {
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
    }
}
