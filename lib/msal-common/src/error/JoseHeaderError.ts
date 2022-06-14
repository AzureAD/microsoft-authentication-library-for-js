/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";

/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const JoseHeaderErrorMessage = {
    missingClaimError: {
        code: "missing_kid_error",
        desc: "The JOSE Header for the requested JWT, JWS, JWE or JWK object requires a claim that wasn't provided."
    }
};

/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export class JoseHeaderError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "JoseHeaderError";

        Object.setPrototypeOf(this, JoseHeaderError.prototype);
    }

    /**
     * Creates an error thrown when a specific claim isn't set on the JOSE Header
     */
    static createMissingClaimError(claimName: string): JoseHeaderError {
        return new JoseHeaderError(JoseHeaderErrorMessage.missingClaimError.code, `${JoseHeaderErrorMessage.missingClaimError.desc} Missing claim: "${claimName}"`);
    }
}
