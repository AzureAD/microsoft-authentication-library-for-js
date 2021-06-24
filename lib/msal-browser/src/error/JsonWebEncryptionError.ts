/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * JsonWebEncryptionMessage class containing string constants used by error codes and messages.
 */
export const JsonWebEncryptionErrorMessage = {
    jweProtectedHeaderNotParsed: {
        code: "jwe_header_not_parsed",
        desc: "Could not parse JWE Protected Header."
    },
    headerAlgorithmMismatch: {
        code: "header_algorithm_mismatch",
        desc: "Algorithm with the following label in JOSE Header doesn't match supported key algorithms"
    }
};

/**
 * JsonWebEncryption error class thrown by the MSAL.js library for SPAs
 */
export class JsonWebEncryptionError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, JsonWebEncryptionError.prototype);
        this.name = "JsonWebEncryptionError";
    }

    /**
     * Creates an error thrown when PKCE is not implemented.
     * @param errDetail 
     */
    static createJweHeaderNotParsedError(): JsonWebEncryptionError {
        return new JsonWebEncryptionError(
            JsonWebEncryptionErrorMessage.jweProtectedHeaderNotParsed.code,
            JsonWebEncryptionErrorMessage.jweProtectedHeaderNotParsed.desc);
    }

    static createHeaderAlgorithmMismatch(label: string): JsonWebEncryptionError {
        return new JsonWebEncryptionError(
            JsonWebEncryptionErrorMessage.headerAlgorithmMismatch.code,
            `${JsonWebEncryptionErrorMessage.headerAlgorithmMismatch.desc}: ${label}`);
    }
}
