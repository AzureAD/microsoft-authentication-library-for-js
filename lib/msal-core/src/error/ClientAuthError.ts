// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { AuthError } from "./AuthError";
import { Utils } from "../Utils";
import { IdToken } from "../IdToken";

export const ClientAuthErrorMessage = {
    multipleMatchingTokens: {
        code: "multiple_matching_tokens",
        desc: "The cache contains multiple tokens satisfying the requirements. " +
            "Call AcquireToken again providing more requirements like authority."
    },
    multipleCacheAuthorities: {
        code: "multiple_authorities",
        desc: "Multiple authorities found in the cache. Pass authority in the API overload."
    },
    endpointResolutionError: {
        code: "endpoints_resolution_error",
        desc: "Error: could not resolve endpoints. Please check network and try again."
    },
    popUpWindowError: {
        code: "popup_window_error",
        desc: "Error opening popup window. This can happen if you are using IE or if popups are blocked in the browser."
    },
    tokenRenewalError: {
        code: "token_renewal_error",
        desc: "Token renewal operation failed due to timeout."
    },
    invalidIdToken: {
        code: "invalid_id_token",
        desc: "Invalid ID token format."
    },
    invalidStateError: {
        code: "invalid_state_error",
        desc: "Invalid state."
    },
    nonceMismatchError: {
        code: "nonce_mismatch_error",
        desc: "Nonce is not matching, Nonce received: "
    },
    loginProgressError: {
        code: "login_progress_error",
        desc: "Login_In_Progress: Error during login call - login is already in progress."
    },
    acquireTokenProgressError: {
        code: "acquiretoken_progress_error",
        desc: "AcquireToken_In_Progress: Error during login call - login is already in progress."
    },
    userCancelledError: {
        code: "user_cancelled",
        desc: "User cancelled the flow."
    },
    callbackError: {
        code: "callback_error",
        desc: "Error occurred in token received callback function."
    },
    userLoginRequiredError: {
        code: "user_login_error",
        desc: "User login is required."
    },
    userDoesNotExistError: {
        code: "user_non_existent",
        desc: "User object does not exist. Please call a login API."
    },
    clientInfoDecodingError: {
        code: "client_info_decoding_error",
        desc: "The client info could not be parsed/decoded correctly. Please review the trace to determine the root cause."
    },
    clientInfoNotPopulatedError: {
        code: "client_info_not_populated_error",
        desc: "The service did not populate client_info in the response, Please verify with the service team"
    },
    nullOrEmptyIdToken: {
        code: "null_or_empty_id_token",
        desc: "The idToken is null or empty. Please review the trace to determine the root cause."
    },
    idTokenNotParsed: {
        code: "id_token_parsing_error",
        desc: "ID token cannot be parsed. Please review stack trace to determine root cause."
    },
    tokenEncodingError: {
        code: "token_encoding_error",
        desc: "The token to be decoded is not encoded correctly."
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

    static createEndpointResolutionError(errDetail?: string): ClientAuthError {
        let errorMessage = ClientAuthErrorMessage.endpointResolutionError.desc;
        if (errDetail && !Utils.isEmpty(errDetail)) {
            errorMessage += ` Details: ${errDetail}`;
        }
        return new ClientAuthError(ClientAuthErrorMessage.endpointResolutionError.code, errorMessage);
    }

    static createMultipleMatchingTokensInCacheError(scope: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleMatchingTokens.code,
            `Cache error for scope ${scope}: ${ClientAuthErrorMessage.multipleMatchingTokens.desc}.`);
    }

    static createMultipleAuthoritiesInCacheError(scope: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.multipleCacheAuthorities.code,
            `Cache error for scope ${scope}: ${ClientAuthErrorMessage.multipleCacheAuthorities.desc}.`);
    }

    static createPopupWindowError(errDetail?: string): ClientAuthError {
        var errorMessage = ClientAuthErrorMessage.popUpWindowError.desc;
        if (errDetail && !Utils.isEmpty(errDetail)) {
            errorMessage += ` Details: ${errDetail}`;
        }
        return new ClientAuthError(ClientAuthErrorMessage.popUpWindowError.code, errorMessage);
    }

    static createTokenRenewalTimeoutError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.tokenRenewalError.code,
            ClientAuthErrorMessage.tokenRenewalError.desc);
    }

    static createInvalidIdTokenError(idToken: IdToken) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidIdToken.code,
            `${ClientAuthErrorMessage.invalidIdToken.desc} Given token: ${idToken}`);
    }

    //TODO: Is this not a security flaw to send the user the state expected??
    static createInvalidStateError(invalidState: string, actualState: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.invalidStateError.code,
            `${ClientAuthErrorMessage.invalidStateError.desc} ${invalidState}, state expected : ${actualState}.`);
    }

    //TODO: Is this not a security flaw to send the user the Nonce expected??
    static createNonceMismatchError(invalidNonce: string, actualNonce: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nonceMismatchError.code,
            `${ClientAuthErrorMessage.nonceMismatchError.desc} ${invalidNonce}, nonce expected : ${actualNonce}.`);
    }

    static createLoginInProgressError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.loginProgressError.code,
            ClientAuthErrorMessage.loginProgressError.desc);
    }

    static createAcquireTokenInProgressError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.acquireTokenProgressError.code,
            ClientAuthErrorMessage.acquireTokenProgressError.desc);
    }

    static createUserCancelledError(): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.userCancelledError.code,
            ClientAuthErrorMessage.userCancelledError.desc);
    }

    static createErrorInCallbackFunction(errorDesc: string): ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.callbackError.code,
            `${ClientAuthErrorMessage.callbackError.desc} ${errorDesc}.`);
    }

    static createUserLoginRequiredError() : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.userLoginRequiredError.code,
            ClientAuthErrorMessage.userLoginRequiredError.desc);
    }

    static createUserDoesNotExistError() : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.userDoesNotExistError.code,
            ClientAuthErrorMessage.userDoesNotExistError.desc);
    }

    static createClientInfoDecodingError(caughtError: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoDecodingError.code,
            `${ClientAuthErrorMessage.clientInfoDecodingError.desc} Failed with error: ${caughtError}`);
    }

    static createClientInfoNotPopulatedError(caughtError: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.clientInfoNotPopulatedError.code,
            `${ClientAuthErrorMessage.clientInfoNotPopulatedError.desc} Failed with error: ${caughtError}`);
    }

    static createIdTokenNullOrEmptyError(invalidRawTokenString: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.nullOrEmptyIdToken.code,
            `${ClientAuthErrorMessage.nullOrEmptyIdToken.desc} Raw ID Token Value: ${invalidRawTokenString}`);
    }

    static createIdTokenParsingError(caughtParsingError: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.idTokenNotParsed.code,
            `${ClientAuthErrorMessage.idTokenNotParsed.desc} Failed with error: ${caughtParsingError}`);
    }

    static createTokenEncodingError(incorrectlyEncodedToken: string) : ClientAuthError {
        return new ClientAuthError(ClientAuthErrorMessage.tokenEncodingError.code,
            `${ClientAuthErrorMessage.tokenEncodingError.desc} Attempted to decode: ${incorrectlyEncodedToken}`);
    }
}
