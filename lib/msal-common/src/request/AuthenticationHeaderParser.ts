/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import { HeaderNames } from "../utils/Constants.js";
import {
    getResponseHeader,
    normalizeResponseHeaders,
} from "../network/ResponseHeaders.js";

type WWWAuthenticateChallenges = {
    nonce?: string;
};

type AuthenticationInfoChallenges = {
    nextnonce?: string;
};

/**
 * This is a helper class that parses supported HTTP response authentication headers to extract and return
 * header challenge values that can be used outside the basic authorization flows.
 */
export class AuthenticationHeaderParser {
    private headers: Record<string, string>;

    /** Captures a case-insensitive snapshot of the response headers. */
    constructor(headers: Record<string, string>) {
        this.headers = normalizeResponseHeaders(headers);
    }

    /**
     * This method parses the SHR nonce value out of either the Authentication-Info or WWW-Authenticate authentication headers.
     * @returns
     */
    getShrNonce(): string {
        // Attempt to parse nonce from Authentiacation-Info
        const authenticationInfo = getResponseHeader(
            this.headers,
            HeaderNames.AuthenticationInfo
        );
        if (authenticationInfo) {
            const authenticationInfoChallenges =
                this.parseChallenges<AuthenticationInfoChallenges>(
                    authenticationInfo
                );
            if (authenticationInfoChallenges.nextnonce) {
                return authenticationInfoChallenges.nextnonce;
            }
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                ""
            );
        }

        // Attempt to parse nonce from WWW-Authenticate
        const wwwAuthenticate = getResponseHeader(
            this.headers,
            HeaderNames.WWWAuthenticate
        );
        if (wwwAuthenticate) {
            const wwwAuthenticateChallenges =
                this.parseChallenges<WWWAuthenticateChallenges>(
                    wwwAuthenticate,
                    true
                );
            if (wwwAuthenticateChallenges.nonce) {
                return wwwAuthenticateChallenges.nonce;
            }
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                ""
            );
        }

        // If neither header is present, throw missing headers error
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.missingNonceAuthenticationHeader,
            ""
        );
    }

    /**
     * Parses an HTTP header's challenge set into a key/value map.
     * @param header
     * @param isWwwAuthenticate - Whether the header requires a leading authentication scheme.
     * @returns
     */
    private parseChallenges<T>(header: string, isWwwAuthenticate = false): T {
        /*
         * WWW-Authenticate starts with a scheme followed by whitespace.
         * Authentication-Info has no scheme, but we also accept its legacy "PoP " prefix.
         * Do not discard its first parameter merely because a space occurs in the header.
         */
        const parameters = header
            .trim()
            .replace(isWwwAuthenticate ? /^\S+\s+/ : /^PoP\s+/i, "");
        const challenges = parameters.split(",");
        const challengeMap = {} as T;

        for (const challenge of challenges) {
            // Capture everything after the first "=" so nonce padding is preserved.
            const [key, value] = challenge.split(/=(.*)/s);
            // Ignore fragments without a value rather than losing a nonce in another parameter.
            if (value === undefined) {
                continue;
            }
            const parameterName = key.trim().toLowerCase();
            // A key with whitespace, such as "Digest realm", starts another challenge.
            if (isWwwAuthenticate && /\s/.test(parameterName)) {
                break;
            }
            // Trim syntax whitespace before removing quotes, preserving whitespace inside the nonce.
            const parameterValue = value.trim();
            challengeMap[parameterName] = unescape(
                parameterValue.replace(/['"]+/g, "")
            );
        }

        return challengeMap;
    }
}
