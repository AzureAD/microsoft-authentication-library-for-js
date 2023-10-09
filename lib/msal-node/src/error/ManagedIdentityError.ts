/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * ManagedIdentityErrorMessage class containing string constants used by error codes and messages.
 */
export const ManagedIdentityErrorMessage = {
    invalidManagedIdentityIdType: {
        code: "invalid_managed_identity_id_type",
        desc: "Provided ManagedIdentityIdType is not of type ManagedIdentityIdType.",
    },
};

export class ManagedIdentityError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ManagedIdentityError";
    }

    /**
     * Create an error thrown if the developer provides a ManagedIdentityIdType that is not of type ManagedIdentityIdType
     */
    static createInvalidManagedIdentityIdTypeError(): ManagedIdentityError {
        return new ManagedIdentityError(
            ManagedIdentityErrorMessage.invalidManagedIdentityIdType.code,
            `${ManagedIdentityErrorMessage.invalidManagedIdentityIdType.desc}`
        );
    }
}
