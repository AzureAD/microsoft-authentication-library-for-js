/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common";

/**
 * NodeAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const NodeConfigurationAuthErrorMessage = {
    stubPcaInstanceCalled: {
        code: "stubbed_public_client_application_called",
        desc: "Stub instance of Public Client Application was called"
    },
    stubCcaInstanceCalled: {
        code: "stubbed_confidential_client_application_called",
        desc: "Stub instance of Confidential Client Application was called"
    },
    stubTokenCacheCalled: {
        code: "stubbed_token_cache_called",
        desc: "Stub instance of Token Cache was called"
    }
};

/**
 * Node library error class thrown by the MSAL.js library for SPAs
 */
export class NodeConfigurationAuthError extends AuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "BrowserConfigurationAuthError";

        Object.setPrototypeOf(this, NodeConfigurationAuthError.prototype);
    }

    /**
     * Creates error thrown when the stub instance of PublicClientApplication is called.
     */
    static createStubPcaInstanceCalledError(): NodeConfigurationAuthError {
        return new NodeConfigurationAuthError(NodeConfigurationAuthErrorMessage.stubPcaInstanceCalled.code,
            NodeConfigurationAuthErrorMessage.stubPcaInstanceCalled.desc);
    }

    /**
     * Creates error thrown when the stub instance of ConfidentialClientApplication is called.
     */
    static createStubCcaInstanceCalledError(): NodeConfigurationAuthError {
        return new NodeConfigurationAuthError(NodeConfigurationAuthErrorMessage.stubCcaInstanceCalled.code,
            NodeConfigurationAuthErrorMessage.stubCcaInstanceCalled.desc);
    }

    /**
     * Creates error thrown when the stub instance of TokenCache is called.
     */
    static createStubTokenCacheCalledError(): NodeConfigurationAuthError {
        return new NodeConfigurationAuthError(NodeConfigurationAuthErrorMessage.stubTokenCacheCalled.code,
            NodeConfigurationAuthErrorMessage.stubTokenCacheCalled.desc);
    }

}
