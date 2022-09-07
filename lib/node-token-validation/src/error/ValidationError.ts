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

    /**
     * Creates an error thrown when the token was validated and the nonce was found to be invalid.
     *
     * @returns {ValidationError} Invalid nonce error
     */
    static createInvalidNonceError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidNonce.code, ValidationErrorMessage.invalidNonce.desc);
    }

    /**
     * Creates an error thrown when the c_hash was detected on the id token, but was invalid when validated against the code.
     *
     * @returns {ValidationError} Invalid c_hash error
     */
    static createInvalidCHashError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidCHash.code, ValidationErrorMessage.invalidCHash.desc);
    }

    /**
     * Creates an error thrown when the at_hash was detected on the id token, but was invalid when validated against the access token.
     *
     * @returns {ValidationError} Invalid at_hash error
     */
    static createInvalidAtHashError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidAtHash.code, ValidationErrorMessage.invalidAtHash.desc);
    }

}
