/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    createClientConfigurationError,
    ClientConfigurationErrorCodes,
} from "../error/ClientConfigurationError.js";
import { validateDpopNonce } from "../cache/entities/DpopNonceEntity.js";
import { HeaderNames } from "../utils/Constants.js";

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
    private headers:
        | Record<string, string>
        | { get(name: string): string | null };

    constructor(
        headers: Record<string, string> | { get(name: string): string | null }
    ) {
        this.headers = headers;
    }

    /**
     * Extracts the standalone DPoP-Nonce response header.
     *
     * The nonce is validated against the centralized DPoP nonce policy and is
     * otherwise returned exactly as supplied, without trimming, decoding, or
     * semantic normalization.
     *
     * @returns The opaque nonce value, or null when the header is absent.
     */
    getDPoPNonce(): string | null {
        const nonce = this.getHeaderValue(HeaderNames.DPOP_NONCE);
        return nonce === null ? null : validateDpopNonce(nonce);
    }

    /**
     * This method parses the SHR nonce value out of either the Authentication-Info or WWW-Authenticate authentication headers.
     * @returns
     */
    getShrNonce(): string {
        // Attempt to parse nonce from Authentiacation-Info
        const authenticationInfo = this.getHeaderValue(
            HeaderNames.AuthenticationInfo
        );
        if (typeof authenticationInfo === "string" && authenticationInfo) {
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
        const wwwAuthenticate = this.getHeaderValue(
            HeaderNames.WWWAuthenticate
        );
        if (typeof wwwAuthenticate === "string" && wwwAuthenticate) {
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
     * Parses an HTTP header's challenge set into a key/value map.
     * @param header
     * @returns
     */
    private parseChallenges<T>(header: string): T {
        const schemeSeparator = header.indexOf(" ");
        const challenges = header.substr(schemeSeparator + 1).split(",");
        const challengeMap = {} as T;

        challenges.forEach((challenge: string) => {
            const [key, value] = challenge.split("=");
            // Remove escaped quotation marks (', ") from challenge string to keep only the challenge value
            challengeMap[key] = unescape(value.replace(/['"]+/g, ""));
        });

        return challengeMap;
    }

    /**
     * Reads a header from a Fetch Headers-like source or a plain record.
     * Record names are matched case-insensitively, and missing undefined
     * values are normalized to null.
     */
    private getHeaderValue(headerName: string): unknown | null {
        const get = (this.headers as { get?: unknown }).get;
        if (typeof get === "function") {
            const value = get.call(this.headers, headerName);
            return value === undefined ? null : value;
        }

        const recordHeaders = this.headers as Record<string, unknown>;
        if (recordHeaders[headerName] !== undefined) {
            return recordHeaders[headerName];
        }

        const normalizedHeaderName = headerName.toLowerCase();
        const matchingHeaderName = Object.keys(recordHeaders).find(
            (name) => name.toLowerCase() === normalizedHeaderName
        );
        return matchingHeaderName ? recordHeaders[matchingHeaderName] : null;
    }
}
