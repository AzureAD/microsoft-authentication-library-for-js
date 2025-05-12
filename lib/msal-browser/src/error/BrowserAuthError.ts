/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import * as BrowserAuthErrorCodes from "./BrowserAuthErrorCodes.js";
export { BrowserAuthErrorCodes }; // Allow importing as "BrowserAuthErrorCodes"

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrowserAuthError extends AuthError {
    constructor(errorCode: string, subError?: string) {
        super(
            errorCode,
            `See https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md#${errorCode} for details`,
            subError
        );

        Object.setPrototypeOf(this, BrowserAuthError.prototype);
        this.name = "BrowserAuthError";
    }
}

export function createBrowserAuthError(
    errorCode: string,
    subError?: string
): BrowserAuthError {
    return new BrowserAuthError(errorCode, subError);
}
