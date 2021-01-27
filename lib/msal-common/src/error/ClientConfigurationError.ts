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
    emptyScopesError: {
        code: "empty_input_scopes_error",
        desc: "Scopes cannot be passed as null, undefined or empty array because they are required to obtain an access token."
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
    invalidClaimsRequest: {
        code: "invalid_claims",
        desc: "Given claims parameter must be a stringified JSON object."
    },
    tokenRequestEmptyError: {
        code: "token_request_empty",
        desc: "Token request was empty and not found in cache."
    },
    logoutRequestEmptyError: {
        code: "logout_request_empty",
        desc: "The logout request was null or undefined."
    },
    invalidCodeChallengeMethod: {
        code: "invalid_code_challenge_method",
        desc: "code_challenge_method passed is invalid. Valid values are \"plain\" and \"S256\"."
    },
    invalidCodeChallengeParams: {
        code: "pkce_params_missing",
        desc: "Both params: code_challenge and code_challenge_method are to be passed if to be sent in the request"
    },
    invalidCloudDiscoveryMetadata: {
        code: "invalid_cloud_discovery_metadata",
        desc: "Invalid cloudDiscoveryMetadata provided. Must be a JSON object containing tenant_discovery_endpoint and metadata fields"
    },
    invalidAuthorityMetadata: {
        code: "invalid_authority_metadata",
        desc: "Invalid authorityMetadata provided. Must by a JSON object containing authorization_endpoint, token_endpoint, end_session_endpoint, issuer fields."
    },
    untrustedAuthority: {
        code: "untrusted_authority",
        desc: "The provided authority is not a trusted authority. Please include this authority in the knownAuthorities config parameter."
    },
    resourceRequestParametersRequired: {
        code: "resourceRequest_parameters_required",
        desc: "resourceRequestMethod and resourceRequestUri are required"
    }
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
    static createRedirectUriEmptyError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.redirectUriNotSet.code,
            ClientConfigurationErrorMessage.redirectUriNotSet.desc);
    }

    /**
     * Creates an error thrown when the post-logout redirect uri is empty (not set by caller)
     */
    static createPostLogoutRedirectUriEmptyError(): ClientConfigurationError {
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
    static createInsecureAuthorityUriError(urlString: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.authorityUriInsecure.code,
            `${ClientConfigurationErrorMessage.authorityUriInsecure.desc} Given URI: ${urlString}`);
    }

    /**
     * Creates an error thrown if URL string does not parse into separate segments.
     * @param urlString
     */
    static createUrlParseError(urlParseError: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.urlParseError.code,
            `${ClientConfigurationErrorMessage.urlParseError.desc} Given Error: ${urlParseError}`);
    }

    /**
     * Creates an error thrown if URL string is empty or null.
     * @param urlString
     */
    static createUrlEmptyError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.urlEmptyError.code,
            ClientConfigurationErrorMessage.urlEmptyError.desc);
    }

    /**
     * Error thrown when scopes are not an array
     * @param inputScopes
     */
    static createScopesNonArrayError(inputScopes: Array<string>): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.nonArrayScopesError.code,
            `${ClientConfigurationErrorMessage.nonArrayScopesError.desc} Given Scopes: ${inputScopes}`);
    }

    /**
     * Error thrown when scopes are empty.
     * @param scopesValue
     */
    static createEmptyScopesArrayError(inputScopes: Array<string>): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.emptyScopesError.code,
            `${ClientConfigurationErrorMessage.emptyScopesError.desc} Given Scopes: ${inputScopes}`);
    }

    /**
     * Error thrown when client id scope is not provided as single scope.
     * @param inputScopes
     */
    static createClientIdSingleScopeError(inputScopes: Array<string>): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.clientIdSingleScopeError.code,
            `${ClientConfigurationErrorMessage.clientIdSingleScopeError.desc} Given Scopes: ${inputScopes}`);
    }

    /**
     * Error thrown when prompt is not an allowed type.
     * @param promptValue
     */
    static createInvalidPromptError(promptValue: string): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidPrompt.code,
            `${ClientConfigurationErrorMessage.invalidPrompt.desc} Given value: ${promptValue}`);
    }

    /**
     * Creates error thrown when claims parameter is not a stringified JSON object
     */
    static createInvalidClaimsRequestError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidClaimsRequest.code,
            ClientConfigurationErrorMessage.invalidClaimsRequest.desc);
    }

    /**
     * Throws error when token request is empty and nothing cached in storage.
     */
    static createEmptyLogoutRequestError(): ClientConfigurationError {
        return new ClientConfigurationError(
            ClientConfigurationErrorMessage.logoutRequestEmptyError.code,
            ClientConfigurationErrorMessage.logoutRequestEmptyError.desc
        );
    }

    /**
     * Throws error when token request is empty and nothing cached in storage.
     */
    static createEmptyTokenRequestError(): ClientConfigurationError {
        return new ClientConfigurationError(
            ClientConfigurationErrorMessage.tokenRequestEmptyError.code,
            ClientConfigurationErrorMessage.tokenRequestEmptyError.desc
        );
    }

    /**
     * Throws error when an invalid code_challenge_method is passed by the user
     */
    static createInvalidCodeChallengeMethodError(): ClientConfigurationError {
        return new ClientConfigurationError(
            ClientConfigurationErrorMessage.invalidCodeChallengeMethod.code,
            ClientConfigurationErrorMessage.invalidCodeChallengeMethod.desc
        );
    }

    /**
     * Throws error when both params: code_challenge and code_challenge_method are not passed together
     */
    static createInvalidCodeChallengeParamsError(): ClientConfigurationError {
        return new ClientConfigurationError(
            ClientConfigurationErrorMessage.invalidCodeChallengeParams.code,
            ClientConfigurationErrorMessage.invalidCodeChallengeParams.desc
        );
    }

    /**
     * Throws an error when the user passes invalid cloudDiscoveryMetadata
     */
    static createInvalidCloudDiscoveryMetadataError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidCloudDiscoveryMetadata.code,
            ClientConfigurationErrorMessage.invalidCloudDiscoveryMetadata.desc);
    }

    /**
     * Throws an error when the user passes invalid cloudDiscoveryMetadata
     */
    static createInvalidAuthorityMetadataError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.invalidAuthorityMetadata.code,
            ClientConfigurationErrorMessage.invalidAuthorityMetadata.desc);
    }

    /**
     * Throws error when provided authority is not a member of the trusted host list
     */
    static createUntrustedAuthorityError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.untrustedAuthority.code,
            ClientConfigurationErrorMessage.untrustedAuthority.desc);
    }

    /**
     * Throws error when resourceRequestMethod or resourceRequestUri is missing
     */
    static createResourceRequestParametersRequiredError(): ClientConfigurationError {
        return new ClientConfigurationError(ClientConfigurationErrorMessage.resourceRequestParametersRequired.code,
            ClientConfigurationErrorMessage.resourceRequestParametersRequired.desc);
    }
}
