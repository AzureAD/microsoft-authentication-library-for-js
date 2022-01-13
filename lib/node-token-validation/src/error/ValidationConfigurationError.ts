import { ClientConfigurationError } from "@azure/msal-common";

export const ValidationConfigurationErrorMessage = {
    missingToken: {
        code: "missing_token",
        desc: "Unable to validate token when token is not provided."
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
    invalidScopes: {
        code: "invalid_scopes",
        desc: "Invalid scopes on token."
    },
    invalidPolicy: {
        code: "invalid_policy",
        desc: "B2C policy on token cannot be validated against policy provided."
    },
    invalidMetadata: {
        code: "invalid_metadata",
        desc: "Metadata returned from well-known endpoint is invalid. Does not contain jwks_uri."
    }
};

export class ValidationConfigurationError extends ClientConfigurationError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ValidationConfigurationError";
        Object.setPrototypeOf(this, ValidationConfigurationError.prototype);
    }

    static createMissingTokenError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.missingToken.code, ValidationConfigurationErrorMessage.missingToken.desc);
    }

    static createInvalidNonceError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidNonce.code, ValidationConfigurationErrorMessage.invalidNonce.desc);
    }

    static createInvalidCHashError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidCHash.code, ValidationConfigurationErrorMessage.invalidCHash.desc);
    }

    static createInvalidAtHashError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidAtHash.code, ValidationConfigurationErrorMessage.invalidAtHash.desc);
    }

    static createInvalidScopesError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidScopes.code, ValidationConfigurationErrorMessage.invalidScopes.desc);
    }

    static createInvalidPolicyError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidPolicy.code, ValidationConfigurationErrorMessage.invalidPolicy.desc);
    }

    static createInvalidMetadataError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidMetadata.code, ValidationConfigurationErrorMessage.invalidMetadata.desc);
    }

}