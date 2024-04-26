/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * NestedAppAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NestedAppAuthErrorMessage = {
    unsupportedMethod: {
        code: "unsupported_method",
        desc: "The PKCE code challenge and verifier could not be generated.",
    },

    noAccountContext: {
        code: "no_account_context_set",
        desc: "The NAA app is not called with an account.",
    },
};

export class NestedAppAuthError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, NestedAppAuthError.prototype);
        this.name = "NestedAppAuthError";
    }

    public static createUnsupportedError(): NestedAppAuthError {
        return new NestedAppAuthError(
            NestedAppAuthErrorMessage.unsupportedMethod.code,
            NestedAppAuthErrorMessage.unsupportedMethod.desc
        );
    }

    public static createNoAccountContextError(): NestedAppAuthError {
        return new NestedAppAuthError(
            NestedAppAuthErrorMessage.noAccountContext.code,
            NestedAppAuthErrorMessage.noAccountContext.desc
        );
    }
}
