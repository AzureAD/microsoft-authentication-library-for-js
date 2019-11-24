/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";

/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const ClientAuthErrorMessage = {

};

/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export class ClientAuthError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientAuthError";

        Object.setPrototypeOf(this, ClientAuthError.prototype);
    }

    static createClientInfoDecodingError(err: string): ClientAuthError {
        throw new Error("Method not implemented.");
    }

    static createIdTokenParsingError(err: string): ClientAuthError {
        throw new Error("Method not implemented.");
    }

    static createIdTokenNullOrEmptyError(rawIdToken: string): ClientAuthError {
        throw new Error("Method not implemented.");
    }

    static createInsecureAuthorityUriError(urlString: string): ClientAuthError {
        throw new Error("Method not implemented.");
    }
    
    static createUrlSegmentError(urlString: string): ClientAuthError {
        throw new Error("Method not implemented.");
    }

    static createEndpointDiscoveryIncompleteError(): ClientAuthError {
        throw new Error("Method not implemented.");
    }

    static createInvalidAuthorityError(invalidAuthorityError: string) {
        throw new Error("Method not implemented.");
    }
}
