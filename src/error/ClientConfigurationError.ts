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
        desc: "Authority URIs must use https."
    },
    urlParseError: {
        code: "url_parse_error",
        desc: "URL could not be parsed into appropriate segments."
    },
    urlEmptyError: {
        code: "empty_url_error",
        desc: "URL was empty or null."
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
}
