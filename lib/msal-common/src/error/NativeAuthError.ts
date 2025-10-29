/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError.js";

/**
 * Error class for MSAL Runtime errors that preserves detailed broker information
 */
export class NativeAuthError extends AuthError {
    /**
     * Numeric error code from MSAL Runtime
     */
    public statusCode: number;

    /**
     * Error tag from MSAL Runtime
     */
    public tag: string;

    constructor(
        errorStatus: string,
        errorContext: string,
        errorCode: number,
        errorTag: number
    ) {
        super(errorStatus, errorContext);
        this.name = "NativeAuthError";
        this.statusCode = errorCode;
        this.tag = errorTag.toString();
        Object.setPrototypeOf(this, NativeAuthError.prototype);
    }
}
