/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "msal-common";

export const ClientConfigurationErrorMessage = {
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
    scopesRequired: {
        code: "scopes_required",
        desc: "Scopes are required to obtain an access token."
    },
    emptyScopes: {
        code: "empty_input_scopes_error",
        desc: "Scopes cannot be passed as empty array."
    },
    nonArrayScopes: {
        code: "nonarray_input_scopes_error",
        desc: "Scopes cannot be passed as non-array."
    },
    clientScope: {
        code: "clientid_input_scopes_error",
        desc: "Client ID can only be provided as a single scope."
    },
    invalidPrompt: {
        code: "invalid_prompt_value",
        desc: "Supported prompt values are 'login', 'select_account', 'consent' and 'none'",
    },
    claimsRequestParsingError: {
        code: "claims_request_parsing_error",
        desc: "Could not parse the given claims request object."
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
export class ClientConfigurationError extends ClientAuthError {

    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientConfigurationError";
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }

    static createNoSetConfigurationError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.configurationNotSet.code,
            `${ClientConfigurationErrorMessage.configurationNotSet.desc}`);
    }

    static createStorageNotSupportedError(givenCacheLocation: string) : ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.storageNotSupported.code,
            `${ClientConfigurationErrorMessage.storageNotSupported.desc} Given location: ${givenCacheLocation}`);
    }

    static createRedirectCallbacksNotSetError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.noRedirectCallbacksSet.code, ClientConfigurationErrorMessage.noRedirectCallbacksSet.desc);
    }

    static createInvalidCallbackObjectError(callbackObject: object): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidCallbackObject.code,
            `${ClientConfigurationErrorMessage.invalidCallbackObject.desc} Given value for callback function: ${callbackObject}`);
    }

    static createEmptyScopesArrayError(scopesValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.emptyScopes.code,
            `${ClientConfigurationErrorMessage.emptyScopes.desc} Given value: ${scopesValue}.`);
    }

    static createScopesNonArrayError(scopesValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.nonArrayScopes.code,
            `${ClientConfigurationErrorMessage.nonArrayScopes.desc} Given value: ${scopesValue}.`);
    }

    static createClientIdSingleScopeError(scopesValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.clientScope.code,
            `${ClientConfigurationErrorMessage.clientScope.desc} Given value: ${scopesValue}.`);
    }

    static createScopesRequiredError(scopesValue: any): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.scopesRequired.code,
            `${ClientConfigurationErrorMessage.scopesRequired.desc} Given value: ${scopesValue}`);
    }

    static createInvalidPromptError(promptValue: any): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidPrompt.code,
            `${ClientConfigurationErrorMessage.invalidPrompt.desc} Given value: ${promptValue}`);
    }

    static createClaimsRequestParsingError(claimsRequestParseError: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.claimsRequestParsingError.code,
            `${ClientConfigurationErrorMessage.claimsRequestParsingError.desc} Given value: ${claimsRequestParseError}`);
    }

    static createEmptyRequestError(): ClientConfigurationError {
        const { code, desc } = ClientConfigurationErrorMessage.emptyRequestError;
        return new ClientConfigurationError(code, desc);
    }
}
