/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * KeyDerivationErrorMessage class containing string constants used by error codes and messages.
 */
export const KeyDerivationErrorMessage = {
    iterationsRequiredError: {
        code: "iterations_required_error",
        desc: "Iterations required n were calculated to be greather than 2^r -1."
    }
};

/**
 *Key Derivation error class thrown by the MSAL.js library for SPAs
 */
export class KeyDerivationError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, KeyDerivationError.prototype);
        this.name = "KeyDerivationError";
    }

    /**
     * Creates an error thrown when the iterations required
     * to generate a derived key are greater than 2^r - 1.
     * @param errDetail 
     */
    static createiterationsRequiredErrorError(n: number, r: number): KeyDerivationError {
        return new KeyDerivationError(KeyDerivationErrorMessage.iterationsRequiredError.code,
            `${KeyDerivationErrorMessage.iterationsRequiredError.desc} Detail: n = ${n}, r = ${r}`);
    }

}
