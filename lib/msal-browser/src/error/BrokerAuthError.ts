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
    }
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrokerAuthError extends BrowserAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, BrokerAuthError.prototype);
        this.name = "BrokerAuthError";
    }

    /**
     * Creates an error thrown when PKCE is not implemented.
     */
    static createNoTokensToCacheError(): BrokerAuthError {
        return new BrokerAuthError(BrokerAuthErrorMessage.noTokensToCacheError.code,
            `${BrokerAuthErrorMessage.noTokensToCacheError.desc}`);
    }
}
