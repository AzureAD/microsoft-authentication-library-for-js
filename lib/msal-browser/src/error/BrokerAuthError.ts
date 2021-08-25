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
    noEmbeddedAppError: {
        code: "no_embedded_app",
        desc: "The embedded application object was not created. Please ensure you have configured your application correctly for an embedded application: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/broker-v2/lib/msal-browser/docs/broker.md#brokered-application-configuration"
    },
    brokerResponseInvalidError: {
        code: "broker_response_invalid",
        desc: "The broker response did not have the expected values."
    },
    brokerRequestIncompleteError: {
        code: "broker_request_incomplete",
        desc: "The brokered request did not have the expected values."
    },
    brokeredPopupRequestRedirecting: {
        code: "broker_popup_will_redirect",
        desc: "The request for a brokered popup requires a redirect by the broker. If your app does not perform the redirect, please check the broker's logs."
    }
};

/**
 * Browser library error class thrown by the MSAL.js library for SPAs
 */
export class BrokerAuthError extends BrowserAuthError {

    static BROKER_AUTH_ERROR_NAME: string = "BrokerAuthError";
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);

        Object.setPrototypeOf(this, BrokerAuthError.prototype);
        this.name = BrokerAuthError.BROKER_AUTH_ERROR_NAME;
    }

    /**
     * Creates an error thrown when PKCE is not implemented.
     */
    static createNoTokensToCacheError(): BrokerAuthError {
        return new BrokerAuthError(BrokerAuthErrorMessage.noTokensToCacheError.code,
            `${BrokerAuthErrorMessage.noTokensToCacheError.desc}`);
    }

    static createNoEmbeddedAppError(): BrokerAuthError {
        return new BrokerAuthError(BrokerAuthErrorMessage.noEmbeddedAppError.code, 
            BrokerAuthErrorMessage.noEmbeddedAppError.desc);
    }

    /**
     * Creates an error thrown when the broker response is invalid.
     * @param errDetail 
     */
    static createBrokerResponseInvalidError(): BrokerAuthError {
        return new BrokerAuthError(BrokerAuthErrorMessage.brokerResponseInvalidError.code,
            `${BrokerAuthErrorMessage.brokerResponseInvalidError.desc}`);
    }

    /**
     * Creates an error thrown when the broker response is invalid. 
     */
    static createBrokerRequestIncompleteError(): BrokerAuthError {
        return new BrokerAuthError(BrokerAuthErrorMessage.brokerRequestIncompleteError.code,
            `${BrokerAuthErrorMessage.brokerRequestIncompleteError.desc}`);
    }

    /**
     * Creates an error thrown when the broker response is invalid.
     * @param errDetail 
     */
    static createBrokerPopupRequestRedirectingError(): BrokerAuthError {
        return new BrokerAuthError(BrokerAuthErrorMessage.brokeredPopupRequestRedirecting.code,
            BrokerAuthErrorMessage.brokeredPopupRequestRedirecting.desc);
    }
}
