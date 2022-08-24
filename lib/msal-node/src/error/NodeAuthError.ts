/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeAuthErrorMessage = {
    addressWrongType: {
        code: "address_wrong_type",
        desc: "Server address is not type string. This is unexpected."
    },
    unableToLoadRedirectUri: {
        code: "unable_to_load_redirectUrl",
        desc: "Loopback server callback was invoked without a url. This is unexpected."
    },
    noAuthCodeInResponse: {
        code: "no_auth_code_in_response",
        desc: "No auth code found in the server response. Please check your network trace to determine what happened."
    },
    noLoopbackServerExists: {
        code: "no_loopback_server_exists",
        desc: "No loopback server exists yet."
    },
    loopbackServerAlreadyExists: {
        code: "loopback_server_already_exists",
        desc: "Loopback server already exists. Cannot create another."
    },
    getPortTimeout: {
        code: "get_port_timeout",
        desc: "Timed out when attempting to get the port the loopback server is running on. This is unexpected."
    }
};

export class NodeAuthError extends AuthError {
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "NodeAuthError";
    }

    /**
     * Creates an error thrown if the client info is empty.
     */
    static createAddressWrongTypeError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.addressWrongType.code,
            `${NodeAuthErrorMessage.addressWrongType.desc}`);
    }

    /**
     * Creates an error thrown if the loopback server is unable to get a url.
     */
    static createUnableToLoadRedirectUrlError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.unableToLoadRedirectUri.code,
            `${NodeAuthErrorMessage.unableToLoadRedirectUri.desc}`);
    }

    /**
     * Creates an error thrown if the server response does not contain an auth code.
     */
    static createNoAuthCodeInResponseError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.noAuthCodeInResponse.code,
            `${NodeAuthErrorMessage.noAuthCodeInResponse.desc}`);
    }

    /**
     * Creates an error thrown if the loopback server has not been spun up yet.
     */
    static createNoLoopbackServerExistsError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.noLoopbackServerExists.code,
            `${NodeAuthErrorMessage.noLoopbackServerExists.desc}`);
    }

    /**
     * Creates an error thrown if a loopback server already exists when attempting to create another one.
     */
    static createLoopbackServerAlreadyExistsError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.loopbackServerAlreadyExists.code,
            `${NodeAuthErrorMessage.loopbackServerAlreadyExists.desc}`);
    }

    /**
     * Creates an error thrown if the loopback server getPort API times out.
     */
    static createGetPortTimeoutError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.getPortTimeout.code,
            `${NodeAuthErrorMessage.getPortTimeout.desc}`);
    }
}
