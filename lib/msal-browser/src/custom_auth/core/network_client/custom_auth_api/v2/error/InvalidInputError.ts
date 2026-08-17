/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Error } from "./CustomAuthV2Error.js";
import { INVALID_INPUT } from "../V2ApiClientConstants.js";

/**
 * Error raised when a caller-supplied argument fails client-side validation
 * before a request is issued - for example an empty username, code, or password,
 * or an unknown method id. It carries the fixed `invalid_input` code so the app
 * can prompt the user to correct the input (via `isInvalidInput()`) rather than
 * treating it as a server or unexpected failure.
 */
export class InvalidInputError extends CustomAuthV2Error {
    constructor(message?: string, correlationId?: string) {
        super(INVALID_INPUT, message, { correlationId });
        Object.setPrototypeOf(this, InvalidInputError.prototype);
    }
}
