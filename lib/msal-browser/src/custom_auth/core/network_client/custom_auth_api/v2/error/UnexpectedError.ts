/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Error } from "./CustomAuthV2Error.js";
import { UNEXPECTED_ERROR } from "./V2ErrorCodes.js";

/**
 * Error raised for an unanticipated failure thrown while driving a native auth
 * V2 flow that is NOT a server error and NOT input validation - for example a
 * runtime exception, a transport failure the network layer did not wrap, or an
 * internal invariant violation. It carries the fixed `unexpected_error` code so
 * the app can treat it as an uncategorized failure distinct from the specific
 * detectors.
 */
export class UnexpectedError extends CustomAuthV2Error {
    constructor(message?: string, correlationId?: string) {
        super(UNEXPECTED_ERROR, message, { correlationId });
        Object.setPrototypeOf(this, UnexpectedError.prototype);
    }
}
