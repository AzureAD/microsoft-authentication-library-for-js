/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Error } from "./CustomAuthV2Error.js";

/**
 * A native auth V2 error raised from a server response, wrapped by an
 * {@link AuthFlowErrorV2Base} as its `errorData` to classify a failure. V2 uses
 * a dedicated shape (not the V1 `CustomAuthError`): a nested
 * `{ error: { code, innerError: { code } } }` on `/api` endpoints and a flat
 * OAuth shape on token endpoints. The entry `401 insufficient_authorization` is
 * not a failure and is never surfaced as this type — it is the expected
 * continuation-token entry response handled on the success path.
 */
export class CustomAuthV2ApiError extends CustomAuthV2Error {
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
        super(code, message, options);
        Object.setPrototypeOf(this, CustomAuthV2ApiError.prototype);
    }
}
