/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * ValidationErrorMessage class containing string constants used by error codes and messages.
 */
export const ValidationErrorMessage = {
    invalidNonce: {
        code: "invalid_nonce",
        desc: "Nonce in token does not match nonce set in validation parameters."
    },
    invalidCHash: {
        code: "invalid_c_hash",
        desc: "C_hash in token unable to be validated against code in token."
    },
    invalidAtHash: {
        code: "invalid_at_hash",
        desc: "At_hash in token unable to be validated against access token."
    }
};

/**
 * Token Validation library error class thrown for validation errors
 */
export class ValidationError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

    static createInvalidNonceError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidNonce.code, ValidationErrorMessage.invalidNonce.desc);
    }

    static createInvalidCHashError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidCHash.code, ValidationErrorMessage.invalidCHash.desc);
    }

    static createInvalidAtHashError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidAtHash.code, ValidationErrorMessage.invalidAtHash.desc);
    }

}
