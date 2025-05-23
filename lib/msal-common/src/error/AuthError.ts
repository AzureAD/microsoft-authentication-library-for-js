/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { EMPTY_STRING } from "../utils/Constants.js";
import * as AuthErrorCodes from "./AuthErrorCodes.js";
export { AuthErrorCodes };

export function getDefaultErrorMessage(code: string): string {
    return `See https://aka.ms/msal.js.errors#${code} for details`;
}

/**
 * General error class thrown by the MSAL.js library.
 */
export class AuthError extends Error {
    /**
     * Short string denoting error
     */
    errorCode: string;

    /**
     * Detailed description of error
     */
    errorMessage: string;

    /**
     * Describes the subclass of an error
     */
    subError: string;

    /**
     * CorrelationId associated with the error
     */
    correlationId: string;

    constructor(errorCode?: string, errorMessage?: string, suberror?: string) {
        const message =
            errorMessage ||
            (errorCode ? getDefaultErrorMessage(errorCode) : "");
        const errorString = message ? `${errorCode}: ${message}` : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, AuthError.prototype);

        this.errorCode = errorCode || EMPTY_STRING;
        this.errorMessage = message || EMPTY_STRING;
        this.subError = suberror || EMPTY_STRING;
        this.name = "AuthError";
    }

    setCorrelationId(correlationId: string): void {
        this.correlationId = correlationId;
    }
}

export function createAuthError(
    code: string,
    additionalMessage?: string
): AuthError {
    return new AuthError(
        code,
        additionalMessage || getDefaultErrorMessage(code)
    );
}
