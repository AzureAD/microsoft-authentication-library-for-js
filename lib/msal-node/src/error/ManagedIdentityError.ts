/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";
import * as ManagedIdentityErrorCodes from "./ManagedIdentityErrorCodes";
export { ManagedIdentityErrorCodes };

/**
 * ManagedIdentityErrorMessage class containing string constants used by error codes and messages.
 */
export const ManagedIdentityErrorMessages = {
    [ManagedIdentityErrorCodes.invalidManagedIdentityIdType]:
        "More than one ManagedIdentityIdType was provided.",
    [ManagedIdentityErrorCodes.invalidResource]:
        "The supplied resource is an invalid URL.",
    [ManagedIdentityErrorCodes.missingId]:
        "A ManagedIdentityId id was not provided.",
    [ManagedIdentityErrorCodes.unableToCreateAzureArc]:
        "Azure Arc Managed Identities can only be system assigned.",
    [ManagedIdentityErrorCodes.unableToCreateSource]:
        "Unable to create a Managed Identity source based on environment variables.",
    [ManagedIdentityErrorCodes.unableToReadSecretFile]:
        "Unable to read the secret file.",
    [ManagedIdentityErrorCodes.urlParseError]:
        "The Managed Identity's 'IDENTITY_ENDPOINT' environment variable is malformed.",
    [ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing]:
        "A 401 response was received form the Azure Arc Managed Identity, but the WWW-Authenticate header is missing.",
    [ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat]:
        "A 401 response was received form the Azure Arc Managed Identity, but the WWW-Authenticate header is in an unsupported format.",
};

export class ManagedIdentityError extends AuthError {
    constructor(errorCode: string) {
        super(errorCode, ManagedIdentityErrorMessages[errorCode]);
        this.name = "ManagedIdentityError";
        Object.setPrototypeOf(this, ManagedIdentityError.prototype);
    }
}

export function createManagedIdentityError(
    errorCode: string
): ManagedIdentityError {
    return new ManagedIdentityError(errorCode);
}
