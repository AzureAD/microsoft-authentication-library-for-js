/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "./ClientAuthError";

/**
 * ClientConfigurationErrorMessage class containing string constants used by error codes and messages.
 */
export const ClientConfigurationErrorMessage = {
    redirectUriNotSet: {
        code: "redirect_uri_empty",
        desc: "A redirect URI is required for all calls, and none has been set."
    },
    postLogoutUriNotSet: {
        code: "post_logout_uri_empty",
        desc: "A post logout redirect has not been set."
    },
    claimsRequestParsingError: {
        code: "claims_request_parsing_error",
        desc: "Could not parse the given claims request object."
    },
    authorityUriInsecure: {
        code: "authority_uri_insecure",
        desc: "Authority URIs must use https.  Please see here for valid authority configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options"
    },
    urlParseError: {
        code: "url_parse_error",
        desc: "URL could not be parsed into appropriate segments."
    },
    urlEmptyError: {
        code: "empty_url_error",
        desc: "URL was empty or null."
    },
    scopesRequiredError: {
        code: "scopes_required",
        desc: "Scopes are required to obtain an access token."
    },
    emptyScopesError: {
        code: "empty_input_scopes_error",
        desc: "Scopes cannot be passed as empty array."
    },
    nonArrayScopesError: {
        code: "nonarray_input_scopes_error",
        desc: "Scopes cannot be passed as non-array."
    },
    clientIdSingleScopeError: {
        code: "clientid_input_scopes_error",
        desc: "Client ID can only be provided as a single scope."
    },
    invalidPrompt: {
        code: "invalid_prompt_value",
        desc: "Supported prompt values are 'login', 'select_account', 'consent' and 'none'.  Please see here for valid configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options",
    },
};

/**
 * Error thrown when there is an error in configuration of the MSAL.js library.
 */
export class ClientConfigurationError extends ClientAuthError {
    
    constructor(errorCode: string, errorMessage?: string) {
        super(errorCode, errorMessage);
        this.name = "ClientConfigurationError";
        Object.setPrototypeOf(this, ClientConfigurationError.prototype);
    }

    /**
     * Creates an error thrown when the redirect uri is empty (not set by caller)
     */
    static createRedirectUriEmptyError(): ClientAuthError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.redirectUriNotSet.code,
            ClientConfigurationErrorMessage.redirectUriNotSet.desc);
    }

    /**
     * Creates an error thrown when the post-logout redirect uri is empty (not set by caller)
     */
    static createPostLogoutRedirectUriEmptyError(): ClientAuthError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.postLogoutUriNotSet.code,
            ClientConfigurationErrorMessage.postLogoutUriNotSet.desc);
    }

    /**
     * Creates an error thrown when the claims request could not be successfully parsed
     */
    static createClaimsRequestParsingError(claimsRequestParseError: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.claimsRequestParsingError.code,
            `${ClientConfigurationErrorMessage.claimsRequestParsingError.desc} Given value: ${claimsRequestParseError}`);
    }

    /**
     * Creates an error thrown if authority uri is given an insecure protocol.
     * @param urlString 
     */
    static createInsecureAuthorityUriError(urlString: string): ClientAuthError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.authorityUriInsecure.code,
            `${ClientConfigurationErrorMessage.authorityUriInsecure.desc} Given URI: ${urlString}`);
    }

    /**
     * Creates an error thrown if URL string does not parse into separate segments.
     * @param urlString 
     */
    static createUrlParseError(urlParseError: string): ClientAuthError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.urlParseError.code,
            `${ClientConfigurationErrorMessage.urlParseError.desc} Given Error: ${urlParseError}`);
    }

    /**
     * Creates an error thrown if URL string is empty or null.
     * @param urlString 
     */
    static createUrlEmptyError(): ClientAuthError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.urlEmptyError.code, ClientConfigurationErrorMessage.urlEmptyError.desc);
    }

    /**
     * Error thrown when input scopes are required.
     * @param inputScopes 
     */
    static createScopesRequiredError(inputScopes: Array<string>) {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.scopesRequiredError.code,
            `${ClientConfigurationErrorMessage.scopesRequiredError.desc} Given Scopes: ${inputScopes.toString()}`);
    }

    /**
     * Error thrown when scopes are not an array
     * @param inputScopes 
     */
    static createScopesNonArrayError(inputScopes: Array<string>) {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.nonArrayScopesError.code,
            `${ClientConfigurationErrorMessage.nonArrayScopesError.desc} Given Scopes: ${inputScopes.toString()}`);
    }

    /**
     * Error thrown when scopes are empty.
     * @param scopesValue 
     */
    static createEmptyScopesArrayError(inputScopes: Array<string>) {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.emptyScopesError.code,
            `${ClientConfigurationErrorMessage.emptyScopesError.desc} Given Scopes: ${inputScopes.toString()}`);
    }

    /**
     * Error thrown when client id scope is not provided as single scope.
     * @param inputScopes 
     */
    static createClientIdSingleScopeError(inputScopes: Array<string>) {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.clientIdSingleScopeError.code,
            `${ClientConfigurationErrorMessage.clientIdSingleScopeError.desc} Given Scopes: ${inputScopes.toString()}`);
    }

    /**
     * Error thrown when prompt is not an allowed type.
     * @param promptValue 
     */
    static createInvalidPromptError(promptValue: any): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidPrompt.code,
            `${ClientConfigurationErrorMessage.invalidPrompt.desc} Given value: ${promptValue}`);
    }
}
