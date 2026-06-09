/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizeResponse } from "../response/AuthorizeResponse.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";

/**
 * Parses hash string from given string. Returns empty string if no hash symbol is found.
 * @param hashString
 */
export function stripLeadingHashOrQuery(responseString: string): string {
    if (responseString.startsWith("#/")) {
        return responseString.substring(2);
    } else if (
        responseString.startsWith("#") ||
        responseString.startsWith("?")
    ) {
        return responseString.substring(1);
    }

    return responseString;
}

/**
 * Returns URL hash as server auth code response object.
 */
export function getDeserializedResponse(
    responseString: string
): AuthorizeResponse | null {
    // Check if given hash is empty
    if (!responseString || responseString.indexOf("=") < 0) {
        return null;
    }
    try {
        // Strip the # or ? symbol if present
        const normalizedResponse = stripLeadingHashOrQuery(responseString);
        // If # symbol was not present, above will return empty string, so give original hash value
        const deserializedHash: AuthorizeResponse = Object.fromEntries(
            new URLSearchParams(normalizedResponse)
        );

        // Check for known response properties
        if (
            deserializedHash.code ||
            deserializedHash.ear_jwe ||
            deserializedHash.error ||
            deserializedHash.error_description ||
            deserializedHash.state
        ) {
            return deserializedHash;
        }
    } catch (e) {
        throw createClientAuthError(ClientAuthErrorCodes.hashNotDeserialized);
    }

    return null;
}

/**
 * Utility to create a URL from the params map
 */
export function mapToQueryString(parameters: Map<string, string>): string {
    const queryParameterArray: Array<string> = new Array<string>();

    parameters.forEach((value, key) => {
        queryParameterArray.push(`${key}=${encodeURIComponent(value)}`);
    });

    return queryParameterArray.join("&");
}

/**
 * Normalizes URLs for comparison per MDN & RFC 3986 standards:
 * - Hash/fragment is removed
 * - Scheme and host are lowercased (case-insensitive per spec)
 * - Path and query parameters preserve original casing (case-sensitive per spec)
 * - Percent-encoding in pathname is normalized (e.g., %27 and ' are treated equivalently)
 * - Ensures pathname ends with /
 * - Strips trailing empty query markers (? or ?/) for malformed URLs
 * @param url - URL to normalize
 * @returns Normalized URL string for comparison
 */
export function normalizeUrlForComparison(url: string): string {
    if (!url) {
        return url;
    }

    const urlWithoutHash = url.split("#")[0];
    if (!urlWithoutHash) {
        return urlWithoutHash;
    }

    try {
        const urlObj = new URL(urlWithoutHash);

        // Decode the pathname to normalize percent-encoding and ensure trailing slash
        let pathname;
        try {
            pathname = decodeURIComponent(urlObj.pathname);
        } catch (e) {
            pathname = urlObj.pathname;
        }

        if (!pathname.endsWith("/")) {
            pathname += "/";
        }

        urlObj.pathname = pathname;

        return urlObj.toString();
    } catch (e) {
        // Fallback for malformed URLs
        let normalized = urlWithoutHash;

        if (normalized.endsWith("?/")) {
            normalized = normalized.slice(0, -2);
        } else if (normalized.endsWith("?")) {
            normalized = normalized.slice(0, -1);
        }

        if (!normalized.endsWith("/")) {
            normalized += "/";
        }

        return normalized;
    }
}
