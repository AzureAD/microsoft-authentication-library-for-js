/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "@azure/msal-common";

export const ValidationConfigurationErrorMessage = {
    missingToken: {
        code: "missing_token",
        desc: "Unable to validate token when token is not provided."
    },
    invalidMetadata: {
        code: "invalid_metadata",
        desc: "Metadata returned from well-known endpoint is invalid."
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

    static createInvalidMetadataError(): ValidationConfigurationError {
        return new ValidationConfigurationError(ValidationConfigurationErrorMessage.invalidMetadata.code, ValidationConfigurationErrorMessage.invalidMetadata.desc);
    }

}
