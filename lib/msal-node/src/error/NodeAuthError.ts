/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/node";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeAuthErrorMessage = {
    stateNotFoundError: {
        code: "state_not_found",
        desc: "State not found. Please verify that the request originated from msal.",
    },
    thumbprintMissing: {
        code: "thumbprint_missing_from_client_certificate",
        desc: "Client certificate does not contain a SHA-1 or SHA-256 thumbprint.",
    },
    unsupportedCcaInstanceAware: {
        code: "unsupported_cca_instance_aware",
        desc: "Instance-aware configuration is not supported by ConfidentialClientApplication.",
    },
};

export class NodeAuthError extends AuthError {
    constructor(
        errorCode: string,
        correlationId: string,
        errorMessage?: string
    ) {
        super(errorCode, correlationId, errorMessage);
        this.name = "NodeAuthError";
    }

    /**
     * Creates an error thrown when the state is not present.
     */
    static createStateNotFoundError(correlationId: string = ""): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.stateNotFoundError.code,
            correlationId,
            NodeAuthErrorMessage.stateNotFoundError.desc
        );
    }

    /**
     * Creates an error thrown when client certificate was provided, but neither the SHA-1 or SHA-256 thumbprints were provided
     */
    static createThumbprintMissingError(): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.thumbprintMissing.code,
            "",
            NodeAuthErrorMessage.thumbprintMissing.desc
        );
    }

    /**
     * Creates an error thrown when instance-aware behavior is requested for a confidential client.
     */
    static createUnsupportedCcaInstanceAwareError(
        correlationId: string = ""
    ): NodeAuthError {
        return new NodeAuthError(
            NodeAuthErrorMessage.unsupportedCcaInstanceAware.code,
            correlationId,
            NodeAuthErrorMessage.unsupportedCcaInstanceAware.desc
        );
    }
}
