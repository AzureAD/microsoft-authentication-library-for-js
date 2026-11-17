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
     * Nonces are opaque: only HTTP quoted-string syntax is decoded, not URI escapes.
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
                    wwwAuthenticate
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
     * Parses scheme-prefixed or scheme-less HTTP authentication parameters.
     * @param header
     * @returns
     */
    private parseChallenges<T>(header: string): T {
        const challenges: string[] = [];
        let challengeStart = 0;
        let quoted = false;
        let escaped = false;

        for (let index = 0; index < header.length; index++) {
            const character = header[index];
            if (escaped) {
                escaped = false;
            } else if (quoted && character === "\\") {
                escaped = true;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (!quoted && character === ",") {
                challenges.push(header.slice(challengeStart, index));
                challengeStart = index + 1;
            }
        }

        if (quoted) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                ""
            );
        }
        challenges.push(header.slice(challengeStart));

        const challengeMap = Object.create(null) as T;
        for (const challenge of challenges) {
            const separator = challenge.indexOf("=");
            // Accept the legacy PoP prefix without treating spaces in values as scheme separators.
            const keyParts = challenge
                .slice(0, separator)
                .trim()
                .split(/[ \t]+/);
            const value = challenge.slice(separator + 1).trim();
            const quotedValue = value.startsWith('"');
            if (
                separator < 1 ||
                keyParts.length > 2 ||
                keyParts.some(
                    (part) => !/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/.test(part)
                ) ||
                (quotedValue
                    ? !/^"(?:[^"\\\r\n]|\\[^\r\n])*"$/.test(value)
                    : /[\s"]/.test(value))
            ) {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                    ""
                );
            }
            const key = keyParts[keyParts.length - 1].toLowerCase();
            challengeMap[key] = quotedValue
                ? value.slice(1, -1).replace(/\\(.)/g, "$1")
                : value;
        }

        return challengeMap;
    }
}
