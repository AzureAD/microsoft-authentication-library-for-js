/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Constants } from "../utils/Constants.js";
import * as AuthErrorCodes from "./AuthErrorCodes.js";
export { AuthErrorCodes };

export function getDefaultErrorMessage(code: string): string {
    return `See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/errors.md#${code} for details`;
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
        const errorString = errorMessage
            ? `${errorCode}: ${errorMessage}`
            : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, AuthError.prototype);

        this.errorCode = errorCode || Constants.EMPTY_STRING;
        this.errorMessage = errorMessage || Constants.EMPTY_STRING;
        this.subError = suberror || Constants.EMPTY_STRING;
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
