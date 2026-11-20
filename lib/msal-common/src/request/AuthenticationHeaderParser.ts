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
     * @returns
     */
    getShrNonce(): string {
        const authenticationInfo = getResponseHeader(
            this.headers,
            HeaderNames.AuthenticationInfo
        );
        const wwwAuthenticate = getResponseHeader(
            this.headers,
            HeaderNames.WWWAuthenticate
        );
        const header = authenticationInfo || wwwAuthenticate;
        if (!header) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.missingNonceAuthenticationHeader,
                ""
            );
        }

        const nonce = this.parseNonce(
            header,
            authenticationInfo ? "nextnonce" : "nonce",
            authenticationInfo ? undefined : "pop"
        );
        if (nonce) {
            return nonce;
        }
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.invalidAuthenticationHeader,
            ""
        );
    }

    /**
     * Extracts a nonce without validating unrelated parameters.
     * RFC 9110 Sections 5.6.4 and 11.6.1 define quoting and challenge boundaries.
     */
    private parseNonce(
        header: string,
        nonceName: string,
        scheme?: string
    ): string | undefined {
        let start = 0;
        let quoted = false;
        let escaped = false;
        let selected = !scheme;

        for (let index = 0; index <= header.length; index++) {
            const character = index < header.length ? header[index] : ",";
            if (escaped) {
                escaped = false;
            } else if (quoted && character === "\\") {
                escaped = true;
            } else if (character === '"') {
                quoted = !quoted;
            } else if (!quoted && character === ",") {
                const part = header.slice(start, index).trim();
                start = index + 1;
                if (!part) {
                    continue;
                }
                const separator = part.indexOf("=");
                const names = (separator < 0 ? part : part.slice(0, separator))
                    .trim()
                    .split(/\s+/);
                if (scheme && (separator < 0 || names.length > 1)) {
                    if (selected) {
                        return undefined;
                    }
                    selected = names[0].toLowerCase() === scheme;
                }
                if (
                    selected &&
                    separator >= 0 &&
                    names[names.length - 1].toLowerCase() === nonceName
                ) {
                    const value = part.slice(separator + 1).trim();
                    if (!value.startsWith('"')) {
                        return value;
                    }
                    return /^"(?:\\.|[^"\\])*"$/.test(value)
                        ? value.slice(1, -1).replace(/\\(.)/g, "$1")
                        : undefined;
                }
            }
        }
        return undefined;
    }
}
