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

const AUTH_TOKEN = "[!#$%&'*+\\-.^_`|~0-9A-Za-z]+";
const AUTH_PARAMETER = new RegExp(`^(${AUTH_TOKEN})[ \\t]*=[ \\t]*(.*)$`);
const AUTH_CHALLENGE = new RegExp(`^(${AUTH_TOKEN})(?:([ \\t]+)(.*))?$`);
const AUTH_TOKEN_VALUE = new RegExp(`^${AUTH_TOKEN}$`);
const PADDED_NONCE_VALUE = new RegExp(`^${AUTH_TOKEN}=+$`);
const TOKEN68 = /^[A-Za-z0-9\-._~+/]+=*$/;
const QUOTED_STRING =
    /^"(?:[\t\x20-\x21\x23-\x5b\x5d-\x7e\x80-\xff]|\\[\t\x20-\x7e\x80-\xff])*"$/;
const MAX_EMPTY_AUTH_ELEMENTS = 32;

/** Removes only HTTP optional whitespace (SP / HTAB), not Unicode whitespace. */
function trimAuthWhitespace(value: string): string {
    let start = 0;
    let end = value.length;
    while (value[start] === " " || value[start] === "\t") {
        start++;
    }
    while (end > start && (value[end - 1] === " " || value[end - 1] === "\t")) {
        end--;
    }
    return value.slice(start, end);
}

/**
 * This is a helper class that parses supported HTTP response authentication headers to extract and return
 * header challenge values that can be used outside the basic authorization flows.
 */
export class AuthenticationHeaderParser {
    private headers: Record<string, string>;

    /**
     * Captures a case-insensitive snapshot of the response headers.
     * Callers must combine repeated field lines into comma-separated values (RFC 9110 Section 5.2).
     */
    constructor(headers: Record<string, string>) {
        this.headers = normalizeResponseHeaders(headers);
    }

    /**
     * This method parses the SHR nonce value out of either the Authentication-Info or WWW-Authenticate authentication headers.
     * Nonces are opaque: only HTTP quoted-string syntax is decoded, not URI escapes.
     * WWW-Authenticate uses the first PoP challenge, never parameters from other challenges.
     * Duplicate parameters and malformed syntax throw invalidAuthenticationHeader.
     * For compatibility, accepts a leading PoP prefix on Authentication-Info,
     * tabs after PoP, and unquoted token nonce values with trailing '=' padding.
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
                    "pop"
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
     * Parses RFC 9110 auth-param and challenge lists (Sections 11.2, 11.3, 11.6).
     * Token/quoted-string and whitespace rules follow Sections 5.6.2-5.6.4.
     * Caps empty-element tolerance at 32 (a local bound permitted by Section 5.6.1.2).
     * https://www.rfc-editor.org/rfc/rfc9110.html
     * @param header
     * @param scheme - When provided, selects only the first matching challenge.
     * @returns
     */
    private parseChallenges<T>(header: string, scheme?: string): T {
        if (/[^\t\x20-\x7e\x80-\xff]/.test(header)) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                ""
            );
        }
        const challenges: string[] = [];
        let challengeStart = 0;
        let quoted = false;
        let escaped = false;
        let emptyElements = 0;

        for (let index = 0; index <= header.length; index++) {
            const character = header[index];
            if (escaped) {
                escaped = false;
            } else if (quoted && character === "\\") {
                escaped = true;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (
                !quoted &&
                (character === "," || index === header.length)
            ) {
                const challenge = header.slice(challengeStart, index);
                if (/^[ \t]*$/.test(challenge)) {
                    if (++emptyElements > MAX_EMPTY_AUTH_ELEMENTS) {
                        throw createClientConfigurationError(
                            ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                            ""
                        );
                    }
                } else {
                    challenges.push(challenge);
                }
                challengeStart = index + 1;
            }
        }

        if (quoted) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                ""
            );
        }
        let parameters: Record<string, string> = Object.create(null);
        let selectedParameters = scheme ? undefined : parameters;
        let acceptsParameters = !scheme;
        for (const [index, challenge] of challenges.entries()) {
            const item = trimAuthWhitespace(challenge);
            let parameter = AUTH_PARAMETER.exec(item);
            if (!parameter) {
                if (scheme) {
                    const prefix = AUTH_CHALLENGE.exec(
                        challenge.replace(/^[ \t]+/, "")
                    );
                    const content = trimAuthWhitespace(prefix?.[3] || "");
                    if (
                        !prefix ||
                        (content &&
                            prefix[1].toLowerCase() !== "pop" &&
                            prefix[2]?.includes("\t"))
                    ) {
                        throw createClientConfigurationError(
                            ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                            ""
                        );
                    }
                    parameters = Object.create(null);
                    if (
                        !selectedParameters &&
                        prefix[1].toLowerCase() === scheme
                    ) {
                        selectedParameters = parameters;
                    }
                    acceptsParameters =
                        !!prefix[2] &&
                        (prefix[2].startsWith(" ") ||
                            prefix[1].toLowerCase() === "pop");
                    if (!content) {
                        continue;
                    }
                    if (TOKEN68.test(content)) {
                        acceptsParameters = false;
                        continue;
                    }
                    parameter = AUTH_PARAMETER.exec(content);
                } else if (index === 0) {
                    // Legacy Authentication-Info responses include a PoP scheme prefix.
                    parameter = AUTH_PARAMETER.exec(
                        item.replace(/^pop[ \t]+/i, "")
                    );
                }
            }
            if (!parameter || !acceptsParameters) {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                    ""
                );
            }

            const key = parameter[1].toLowerCase();
            const value = parameter[2];
            const quotedValue = QUOTED_STRING.test(value);
            if (
                Object.prototype.hasOwnProperty.call(parameters, key) ||
                (!quotedValue &&
                    !AUTH_TOKEN_VALUE.test(value) &&
                    !(
                        (key === "nonce" || key === "nextnonce") &&
                        PADDED_NONCE_VALUE.test(value)
                    ))
            ) {
                throw createClientConfigurationError(
                    ClientConfigurationErrorCodes.invalidAuthenticationHeader,
                    ""
                );
            }
            parameters[key] = quotedValue
                ? value.slice(1, -1).replace(/\\(.)/g, "$1")
                : value;
        }

        return (selectedParameters || Object.create(null)) as T;
    }
}
