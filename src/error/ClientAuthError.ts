/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";

/**
 * ClientAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const ClientAuthErrorMessage = {
    clientInfoDecodingError: {
        code: "client_info_decoding_error",
        desc: "The client info could not be parsed/decoded correctly. Please review the trace to determine the root cause."
    },
    clientInfoEmptyError: {
        code: "client_info_empty_error",
        desc: "The client info was empty. Please review the trace to determine the root cause."
    },
    idTokenParsingError: {
        code: "id_token_parsing_error",
        desc: "ID token cannot be parsed. Please review stack trace to determine root cause."
    },
    nullOrEmptyIdToken: {
        code: "null_or_empty_id_token",
        desc: "The idToken is null or empty. Please review the trace to determine the root cause."
    },
    endpointResolutionError: {
        code: "endpoints_resolution_error",
        desc: "Error: could not resolve endpoints. Please check network and try again."
    },
    invalidAuthorityType: {
        code: "invalid_authority_type",
        desc: "The given authority is not a valid type of authority supported by MSAL. Please see here for valid authority configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options"
    },
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

    /**
     * Creates an error thrown when client info object doesn't decode correctly.
     * @param caughtError 
     */
    static createClientInfoDecodingError(caughtError: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoDecodingError.code,
            `${ClientAuthErrorMessage.clientInfoDecodingError.desc} Failed with error: ${caughtError}`);
    }

    /**
     * Creates an error thrown if the client info is empty.
     * @param rawClientInfo 
     */
    static createClientInfoEmptyError(rawClientInfo: string) {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoEmptyError.code,
            `${ClientAuthErrorMessage.clientInfoEmptyError.desc} Given Object: ${rawClientInfo}`);
    }

    /**
     * Creates an error thrown when the id token extraction errors out.
     * @param err 
     */
    static createIdTokenExtractionError(caughtExtractionError: any) {
        return new ClientAuthError(ClientAuthErrorMessage.idTokenParsingError.code,
            `${ClientAuthErrorMessage.idTokenParsingError.desc} Failed with error: ${caughtExtractionError}`);
    }

    /**
     * Creates an error thrown when the id token string is null or empty.
     * @param invalidRawTokenString 
     */
    static createIdTokenNullOrEmptyError(invalidRawTokenString: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nullOrEmptyIdToken.code,
            `${ClientAuthErrorMessage.nullOrEmptyIdToken.desc} Raw ID Token Value: ${invalidRawTokenString}`);
    }

    /**
     * Creates an error thrown when the endpoint discovery doesn't complete correctly.
     */
    static createEndpointDiscoveryIncompleteError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.endpointResolutionError.code, ClientAuthErrorMessage.endpointResolutionError.desc);
    }

    /**
     * Creates an error thrown if authority type is not valid.
     * @param invalidAuthorityError 
     */
    static createInvalidAuthorityTypeError(givenUrl: string) {
        return new ClientAuthError(ClientAuthErrorMessage.invalidAuthorityType.code, `${ClientAuthErrorMessage.invalidAuthorityType.desc} ${givenUrl}`);
    }

}
