/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeAuthErrorMessage = {
    stateNotFoundError: {
        code: "state_not_found",
        desc: "State not found. Please verify that the request originated from msal."
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
     * Creates an error thrown when the state is not present.
     */
    static createStateNotFoundError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.stateNotFoundError.code, NodeAuthErrorMessage.stateNotFoundError.desc);
    }

}
