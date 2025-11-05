/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NativeBrokerStringUtils } from "../utils/NativeBrokerStringUtils.js";
import { AuthError } from "./AuthError.js";

/**
 * Error class for MSAL Runtime errors that preserves detailed broker information
 */
export class PlatformBrokerError extends AuthError {
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
        this.name = "PlatformBrokerError";
        this.statusCode = errorCode;
        this.tag = NativeBrokerStringUtils.tagToString(errorTag);
        Object.setPrototypeOf(this, PlatformBrokerError.prototype);
    }
}
