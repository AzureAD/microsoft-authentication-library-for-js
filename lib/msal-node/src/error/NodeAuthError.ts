/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeAuthErrorMessage = {
    hashEmptyError: {
        code: "hash_empty_error",
        desc: "Hash value cannot be processed because it is empty. Please verify that your redirectUri is not clearing the hash."
    },
    hashDoesNotContainStateError: {
        code: "no_state_in_hash",
        desc: "Hash does not contain state. Please verify that the request originated from msal."
    },
   
    unableToParseStateError: {
        code: "unable_to_parse_state",
        desc: "Unable to parse state. Please verify that the request originated from msal."
    },
};

/**
 * Node library error class thrown by the MSAL.js library.
 */
export class NodeAuthError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, NodeAuthError.prototype);
        this.name = "NodeAuthError";
    }

    /**
     * Creates an error thrown when the hash string value is unexpectedly empty.
     * @param hashValue 
     */
    static createEmptyHashError(hashValue: string): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.hashEmptyError.code, `${NodeAuthErrorMessage.hashEmptyError.desc} Given Url: ${hashValue}`);
    }

    /**
     * Creates an error thrown when the hash string value is unexpectedly empty.
     */
    static createHashDoesNotContainStateError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.hashDoesNotContainStateError.code, NodeAuthErrorMessage.hashDoesNotContainStateError.desc);
    }

}
