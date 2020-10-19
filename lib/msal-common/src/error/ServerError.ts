/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";

/**
 * Error thrown when there is an error with the server code, for example, unavailability.
 */
export class ServerError extends AuthError {

    subError: string;

    constructor(errorCode: string, errorMessage?: string, subError?: string) {
        super(errorCode, errorMessage);
        this.name = "ServerError";
        this.subError = subError;

        Object.setPrototypeOf(this, ServerError.prototype);
    }
}
