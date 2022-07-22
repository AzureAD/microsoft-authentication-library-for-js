/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "@azure/msal-common";

/**
 * ValidationConfigurationErrorMessage class containing string constants used by error codes and messages.
 */
export const ValidationConfigurationErrorMessage = {
    missingToken: {
        code: "missing_token",
        desc: "Unable to validate token when token is not provided."
    },
    emptyIssuer: {
        code: "empty_issuer",
        desc: "Unable to validate token when validIssuers provided is empty."
    },
    emptyAudience: {
        code: "empty_audience",
        desc: "Unable to validate token when validAudiences provided is empty."
    },
    missingNonce: {
        code: "missing_nonce",
        desc: "Nonce is present on id token, but nonce is not set in validationParams. Provide nonce to validate id token."
    },
    invalidMetadata: {
        code: "invalid_metadata",
        desc: "Metadata returned from well-known endpoint is invalid and does not contain jwks_uri."
    },
    invalidAuthenticationScheme: {
        code: "invalid_auth_scheme",
        desc: "Invalid authentication scheme. Only bearer is supported by the library at this time."
    },
    negativeClockSkew: {
        code: "negative_clock_skew",
        desc: "Invalid clock skew value. Clock skew must be a positive integer."
    }
};

/**
 * Token Validation library error class thrown for configuration errors
 */
export class ValidationConfigurationError extends ClientConfigurationError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ValidationConfigurationError";
        Object.setPrototypeOf(this, ValidationConfigurationError.prototype);
    }

    /**
     * Creates an error thrown when the token is missing.
     *
     * @param {string} appendError Additional details for the missing token error
     * @returns {ValidationConfigurationError} Missing token error
     */
    static createMissingTokenError(appendError?: string): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.missingToken.code, `${ValidationConfigurationErrorMessage.missingToken.desc} Detail: ${appendError}`);
    }

    /**
     * Creates an error thrown when the issuer is empty.
     *
     * @returns {ValidationConfigurationError} Empty issuer error
     */
    static createEmptyIssuerError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.emptyIssuer.code, ValidationConfigurationErrorMessage.emptyIssuer.desc);
    }

    /**
     * Creates an error thrown when the audience is empty.
     *
     * @returns {ValidationConfigurationError} Empty audience error
     */
    static createEmptyAudienceError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.emptyAudience.code, ValidationConfigurationErrorMessage.emptyAudience.desc);
    }

    /**
     * Creates an error thrown when the nonce is empty.
     *
     * @returns {ValidationConfigurationError} Empty nonce error
     */
    static createMissingNonceError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.missingNonce.code, ValidationConfigurationErrorMessage.missingNonce.desc);
    }

    /**
     * Creates an error thrown when the metadata returned is not valid and does not contain the fields required by the library.
     *
     * @returns {ValidationConfigurationError} Invalid metadata error
     */
    static createInvalidMetadataError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidMetadata.code, ValidationConfigurationErrorMessage.invalidMetadata.desc);
    }

    /**
     * Creates an error thrown when the authentication scheme detected is not valid. The library only supports bearer auth at the moment.
     *
     * @param {string} appendError Additional details for the error.
     * @returns {ValidationConfigurationError} Invalid authentication scheme error
     */
    static createInvalidAuthenticationScheme(appendError?: string): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidAuthenticationScheme.code, `${ValidationConfigurationErrorMessage.invalidAuthenticationScheme.desc} Detail: ${appendError}`);
    }

    /**
     * Creates an error thrown when the clock skew set is not a positive integer.
     *
     * @returns {ValidationConfigurationError} Negative clock skew error
     */
    static createNegativeClockSkewError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.negativeClockSkew.code, ValidationConfigurationErrorMessage.negativeClockSkew.desc);
    }
}
