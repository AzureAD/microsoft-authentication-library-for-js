/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { Constants, HeaderNames } from "../utils/Constants";

type WWWAuthenticateChallenges = {
    nonce?: string,
    claims?: string
};

type AuthenticationInfoChallenges = {
    nextnonce?: string
};

/**
 * This is a helper class that parses supported HTTP response authentication headers to extract and return
 * header challenge values that can be used outside the basic authorization flows.
 */
export class AuthenticationHeaderParser {
    protected headers: Record<string, string>;

    constructor(headers: Record<string, string>) {
        this.headers = headers;
    }

    /**
     * This method parses the SHR nonce value out of either the Authentication-Info or WWW-Authenticate authentication headers.
     * @returns 
     */
    getShrNonce(): string {
        // Attempt to parse nonce from Authentiacation-Info
        const authenticationInfo = this.headers[HeaderNames.AuthenticationInfo];
        if (authenticationInfo) {
            const authenticationInfoChallenges = this.parseChallenges<AuthenticationInfoChallenges>(authenticationInfo);
            if (authenticationInfoChallenges.nextnonce) {
                return authenticationInfoChallenges.nextnonce;
            }
            throw ClientConfigurationError.createInvalidAuthenticationHeaderError(HeaderNames.AuthenticationInfo, "nextnonce challenge is missing.");
        }

        // Attempt to parse nonce from WWW-Authenticate
        const wwwAuthenticate = this.headers[HeaderNames.WWWAuthenticate];
        if (wwwAuthenticate) {
            const wwwAuthenticateChallenges = this.parseChallenges<WWWAuthenticateChallenges>(wwwAuthenticate);     
            if (wwwAuthenticateChallenges.nonce){
                return wwwAuthenticateChallenges.nonce;
            }
            throw ClientConfigurationError.createInvalidAuthenticationHeaderError(HeaderNames.WWWAuthenticate, "nonce challenge is missing.");
        }

        // If neither header is present, throw missing headers error
        throw ClientConfigurationError.createMissingNonceAuthenticationHeadersError();
    }

    /**
     * This method parses the claims value (if present) out of the WWW-Authenticate authentication header.
     * See: https://docs.microsoft.com/en-us/azure/active-directory/develop/claims-challenge
     * @returns 
     */
    getClaims(): string | null {
        // Attempt to parse claims from WWW-Authenticate
        const wwwAuthenticate = this.headers[HeaderNames.WWWAuthenticate];
        if (wwwAuthenticate) {
            const wwwAuthenticateChallenges = this.parseChallenges<WWWAuthenticateChallenges>(wwwAuthenticate);     
            if (wwwAuthenticateChallenges.claims){
                return wwwAuthenticateChallenges.claims;
            }
        }

        return null;
    }

    /**
     * Parses an HTTP header's challenge set into a key/value map.
     * @param header 
     * @returns 
     */
    protected parseChallenges<T>(header: string): T {
        const schemeSeparator = header.indexOf(" ");
        const challenges = header.substr(schemeSeparator + 1).split(",");
        const challengeMap = {} as T;

        challenges.forEach((challenge: string) => {
            const [ key, value ] = challenge.split("=");
            // Remove escaped quotation marks (', ") from challenge string to keep only the challenge value
            challengeMap[key.trim()] = unescape(value.replace(/['"]+/g, Constants.EMPTY_STRING));
        });

        return challengeMap;
    }
}
