/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

export const ValidationErrorMessage = {
    invalidAlgorithm: {
        code: "invalid_algorithm",
        desc: "Invalid algorithm on token when using custom AlgorithmValidator."
    },
    invalidIssuer: {
        code: "invalid_issuer",
        desc: "Invalid issuer on token when using custom IssuerValidator."
    },
    invalidAudience: {
        code: "invalid_audience",
        desc: "Invalid audience on token when using custom AudienceValidator."
    },
    invalidSignature: {
        code: "invalid_signature",
        desc: "Invalid signature on token when using custom SignatureValidator."
    },
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
    },
    invalidMetadata: {
        code: "invalid_metadata",
        desc: "Metadata returned from well-known endpoint is invalid. Does not contain jwks_uri."
    }
};

export class ValidationError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ValidationError";
        Object.setPrototypeOf(this, ValidationError.prototype);
    }

    static createInvalidAlgorithmError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidAlgorithm.code, ValidationErrorMessage.invalidAlgorithm.desc);
    }

    static createInvalidIssuerError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidIssuer.code, ValidationErrorMessage.invalidIssuer.desc);
    }

    static createInvalidAudienceError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidAudience.code, ValidationErrorMessage.invalidAudience.desc);
    }

    static createInvalidSignatureError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidSignature.code, ValidationErrorMessage.invalidSignature.desc);
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

    static createInvalidMetadataError(): ValidationError {
        return new ValidationError(ValidationErrorMessage.invalidMetadata.code, ValidationErrorMessage.invalidMetadata.desc);
    }

}
