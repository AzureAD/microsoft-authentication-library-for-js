/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "./AuthError";
import { IdToken } from "../auth/IdToken";
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
        desc: "The given authority is not a valid type of authority supported by MSAL. Please review the trace to determine the root cause."
    },
    hashNotDeserialized: {
        code: "hash_not_deserialized",
        desc: "The hash parameters could not be deserialized. Please review the trace to determine the root cause."
    },
    blankGuidGenerated: {
        code: "blank_guid_generated",
        desc: "The guid generated was blank. Please review the trace to determine the root cause."
    },
    stateMismatchError: {
        code: "state_mismatch",
        desc: "State mismatch error. Please check your network. Continued requests may cause cache overflow."
    },
    nonceMismatchError: {
        code: "nonce_mismatch",
        desc: "Nonce mismatch error. Please check whether concurrent requests are causing this issue."
    },
    accountMismatchError: {
        code: "account_mismatch",
        desc: "The cached account and account which made the token request do not match."
    },
    invalidIdToken: {
        code: "invalid_id_token",
        desc: "Invalid ID token format."
    },
    authCodeNullOrEmptyError: {
        code: "auth_code_null_or_empty",
        desc: "The authorization code or code response was null. Please check the stack trace and logs for more information."
    }
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
    static createIdTokenParsingError(caughtExtractionError: any) {
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
    static createInvalidAuthorityTypeError(givenUrl: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidAuthorityType.code, `${ClientAuthErrorMessage.invalidAuthorityType.desc} Given Url: ${givenUrl}`);
    }

    /**
     * Creates an error thrown when the hash cannot be deserialized.
     * @param invalidAuthorityError 
     */
    static createHashNotDeserializedError(hashParamObj: any): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.hashNotDeserialized.code, `${ClientAuthErrorMessage.hashNotDeserialized.desc} Given Object: ${hashParamObj}`);
    }

    /**
     * Creates an error thrown when two states do not match.
     */
    static createStateMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.stateMismatchError.code, ClientAuthErrorMessage.stateMismatchError.desc);
    }

    /**
     * Creates an error thrown when the nonce does not match.
     */
    static createNonceMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nonceMismatchError.code, ClientAuthErrorMessage.nonceMismatchError.desc);
    }

    static createAccountMismatchError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.accountMismatchError.code, ClientAuthErrorMessage.accountMismatchError.desc);
    }

    /**
     * Throws error if idToken is not correctly formed
     * @param idToken 
     */
    static createInvalidIdTokenError(idToken: IdToken) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidIdToken.code,
            `${ClientAuthErrorMessage.invalidIdToken.desc} Given token: ${idToken}`);
    }

    /**
     * Creates an error thrown when the authorization code required for a token request is null or empty.
     */
    static createAuthCodeNullOrEmptyError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.authCodeNullOrEmptyError.code, ClientAuthErrorMessage.authCodeNullOrEmptyError.desc);
    }

}
