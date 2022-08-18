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
    hostHeaderMissing: {
        code: "host_header_missing",
        desc: "Host header is missing in the request. This is unexpected."
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
     * Creates an error thrown if the host header is missing.
     */
    static createHostHeaderMissingError(): NodeAuthError {
        return new NodeAuthError(NodeAuthErrorMessage.hostHeaderMissing.code,
            `${NodeAuthErrorMessage.hostHeaderMissing.desc}`);
    }
}
