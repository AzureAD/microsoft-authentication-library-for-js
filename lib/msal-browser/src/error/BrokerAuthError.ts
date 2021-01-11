/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BrowserAuthError } from "./BrowserAuthError";

/**
 * BrowserAuthErrorMessage class containing string constants used by error codes and messages.
 */
export const BrokerAuthErrorMessage = {
    noTokensToCacheError: {
        code: "no_tokens_to_cache",
        desc: "The broker did not have any tokens for the client to cache."
    },
    brokerResponseInvalidError: {
        code: "broker_response_invalid",
        desc: "The broker response did not have the expected values."
    }
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrokerAuthError extends BrowserAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, BrowserAuthError.prototype);
        this.name = "BrokerAuthError";
    }

    /**
     * Creates an error thrown when tokens to be cached by the embedded application are not found.
     * @param errDetail 
     */
    static createNoTokensToCacheError(): BrokerAuthError {
        return new BrowserAuthError(BrokerAuthErrorMessage.noTokensToCacheError.code,
            `${BrokerAuthErrorMessage.noTokensToCacheError.desc}`);
    }

    /**
     * Creates an error thrown when the broker response is invalid.
     * @param errDetail 
     */
    static createBrokerResponseInvalidError(): BrokerAuthError {
        return new BrowserAuthError(BrokerAuthErrorMessage.brokerResponseInvalidError.code,
            `${BrokerAuthErrorMessage.brokerResponseInvalidError.desc}`);
    }
}
