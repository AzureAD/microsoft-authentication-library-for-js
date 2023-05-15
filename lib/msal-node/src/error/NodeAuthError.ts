/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeAuthErrorMessage = {
    invalidLoopbackAddressType: {
        code: "invalid_loopback_server_address_type",
        desc: "Loopback server address is not type string. This is unexpected.",
    },
    unableToLoadRedirectUri: {
        code: "unable_to_load_redirectUrl",
        desc: "Loopback server callback was invoked without a url. This is unexpected.",
    },
    noAuthCodeInResponse: {
        code: "no_auth_code_in_response",
        desc: "No auth code found in the server response. Please check your network trace to determine what happened.",
    },
    noLoopbackServerExists: {
        code: "no_loopback_server_exists",
        desc: "No loopback server exists yet.",
    },
    loopbackServerAlreadyExists: {
        code: "loopback_server_already_exists",
        desc: "Loopback server already exists. Cannot create another.",
    },
    loopbackServerTimeout: {
        code: "loopback_server_timeout",
        desc: "Timed out waiting for auth code listener to be registered.",
    },
    stateNotFoundError: {
        code: "state_not_found",
        desc: "State not found. Please verify that the request originated from msal.",
    },
};

export class NodeAuthError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "NodeAuthError";
    }

    /**
     * Creates an error thrown if loopback server address is of type string.
     */
    static createInvalidLoopbackAddressTypeError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.invalidLoopbackAddressType.code,
            `${NodeAuthErrorMessage.invalidLoopbackAddressType.desc}`
        );
    }

    /**
     * Creates an error thrown if the loopback server is unable to get a url.
     */
    static createUnableToLoadRedirectUrlError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.unableToLoadRedirectUri.code,
            `${NodeAuthErrorMessage.unableToLoadRedirectUri.desc}`
        );
    }

    /**
     * Creates an error thrown if the server response does not contain an auth code.
     */
    static createNoAuthCodeInResponseError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.noAuthCodeInResponse.code,
            `${NodeAuthErrorMessage.noAuthCodeInResponse.desc}`
        );
    }

    /**
     * Creates an error thrown if the loopback server has not been spun up yet.
     */
    static createNoLoopbackServerExistsError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.noLoopbackServerExists.code,
            `${NodeAuthErrorMessage.noLoopbackServerExists.desc}`
        );
    }

    /**
     * Creates an error thrown if a loopback server already exists when attempting to create another one.
     */
    static createLoopbackServerAlreadyExistsError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.loopbackServerAlreadyExists.code,
            `${NodeAuthErrorMessage.loopbackServerAlreadyExists.desc}`
        );
    }

    /**
     * Creates an error thrown if the loopback server times out registering the auth code listener.
     */
    static createLoopbackServerTimeoutError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.loopbackServerTimeout.code,
            `${NodeAuthErrorMessage.loopbackServerTimeout.desc}`
        );
    }

    /**
     * Creates an error thrown when the state is not present.
     */
    static createStateNotFoundError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.stateNotFoundError.code,
            NodeAuthErrorMessage.stateNotFoundError.desc
        );
    }
}
