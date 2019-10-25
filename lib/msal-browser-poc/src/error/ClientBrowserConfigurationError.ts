/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "msal-common";

export const ClientBrowserConfigurationErrorMessage = {
    configurationNotSet: {
        code: "no_config_set",
        desc: "Configuration has not been set. Please call the UserAgentApplication constructor with a valid Configuration object."
    },
    storageNotSupported: {
        code: "storage_not_supported",
        desc: "The value for the cacheLocation is not supported."
    },
    noRedirectCallbacksSet: {
        code: "no_redirect_callbacks",
        desc: "No redirect callbacks have been set. Please call setRedirectCallbacks() with the appropriate function arguments before continuing. " +
            "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL-basics."
    },
    invalidCallbackObject: {
        code: "invalid_callback_object",
        desc: "The object passed for the callback was invalid. " +
          "More information is available here: https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/MSAL-basics."
    },
    emptyRequestError: {
        code: "empty_request_error",
        desc: "Request object is required."
    },
    telemetryConfigError: {
        code: "telemetry_config_error",
        desc: "Telemetry config is not configured with required values"
    }
};

/**
 * Error thrown when there is an error in configuration of the .js library.
 */
export class ClientBrowserConfigurationError extends ClientConfigurationError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientConfigurationError";
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }

    static createNoSetConfigurationError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientBrowserConfigurationErrorMessage.configurationNotSet.code,
            `${ClientBrowserConfigurationErrorMessage.configurationNotSet.desc}`);
    }

    static createStorageNotSupportedError(givenCacheLocation: string) : ClientConfigurationError {
        return new ClientConfigurationError(ClientBrowserConfigurationErrorMessage.storageNotSupported.code,
            `${ClientBrowserConfigurationErrorMessage.storageNotSupported.desc} Given location: ${givenCacheLocation}`);
    }

    static createRedirectCallbacksNotSetError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientBrowserConfigurationErrorMessage.noRedirectCallbacksSet.code, ClientBrowserConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    }

    static createInvalidCallbackObjectError(callbackObject: object): ClientConfigurationError {
        return new ClientConfigurationError(ClientBrowserConfigurationErrorMessage.invalidCallbackObject.code,
            `${ClientBrowserConfigurationErrorMessage.invalidCallbackObject.desc} Given value for callback function: ${callbackObject}`);
    }

    static createEmptyRequestError(): ClientConfigurationError {
        const { code, desc } = ClientBrowserConfigurationErrorMessage.emptyRequestError;
        return new ClientConfigurationError(code, desc);
    }
}
