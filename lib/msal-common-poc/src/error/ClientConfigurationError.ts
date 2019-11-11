/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "./ClientAuthError";

export const ClientConfigurationErrorMessage = {
    configurationNotSet: {
        code: "no_config_set",
        desc: "Configuration has not been set. Please call the UserAgentApplication constructor with a valid Configuration object."
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
    },
    authCodeRequestError: {
        code: "auth_code_request_error",
        desc: "No Authorization code is present in the token request, or the request is malformed/empty."
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

    static createAuthCodeRequestError(givenTokenRequest: string): ClientConfigurationError {
        const { code, desc } = ClientConfigurationErrorMessage.authCodeRequestError;
        return new ClientConfigurationError(code, `${desc} Given Request: ${givenTokenRequest}`);
    }
}
