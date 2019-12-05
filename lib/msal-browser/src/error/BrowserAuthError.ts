/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { AuthError } from "msal-common";

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrowserAuthErrorMessage = {
    noWindowObjectError: {
        code: "no_window_object",
        desc: "No window object detected."
    },
    pkceNotGenerated: {
        code: "pkce_not_created",
        desc: "The PKCE code challenge and verifier could not be generated."
    }
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrowserAuthError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "BrowserAuthError";

        Object.setPrototypeOf(this, BrowserAuthError.prototype);
    }

    static createNoWindowObjectError(): BrowserAuthError {
        return new BrowserAuthError(BrowserAuthErrorMessage.noWindowObjectError.code, BrowserAuthErrorMessage.noWindowObjectError.desc);
    }

    static createPkceNotGeneratedError(arg0: string) {
        return new BrowserAuthError(BrowserAuthErrorMessage.pkceNotGenerated.code,
            BrowserAuthErrorMessage.pkceNotGenerated.desc);
    }
}
