/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizeResponse } from "../response/AuthorizeResponse.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import { StringUtils } from "./StringUtils.js";

/**
 * Canonicalizes a URL for comparison per RFC 3986 standards:
 * - Only scheme and host are lowercased (case-insensitive per spec)
 * - Path and query parameters are preserved as-is (case-sensitive per spec)
 * - Percent-encoding is normalized (e.g., %27 and ' are treated equivalently)
 * - Strips trailing empty query markers (? or ?/)
 * - Ensures pathname ends with /
 * @param url - URL to canonicalize
 * @returns Canonicalized URL
 */
function canonicalizeUrl(url: string): string {
    if (!url) {
        return url;
    }

    try {
        const urlObj = new URL(url);

        /*
         * URL API lowercases scheme and host per RFC 3986
         * Decode pathname to normalize percent-encoding (e.g., %27 and ' become equivalent)
         */
        let pathname;
        try {
            pathname = decodeURIComponent(urlObj.pathname);
        } catch (e) {
            pathname = urlObj.pathname;
        }

        if (!pathname.endsWith("/")) {
            pathname += "/";
        }

        /*
         * Normalize query param encoding via URLSearchParams
         * This ensures percent-encoded and decoded characters are treated equivalently
         */
        const normalizedSearch = urlObj.searchParams.toString();
        const search = normalizedSearch ? `?${normalizedSearch}` : "";

        return urlObj.origin + pathname + search;
    } catch (e) {
        // Fallback for malformed URLs - strip trailing ? or ?/ and ensure trailing /
        let canonicalizedUrl = url;

        if (StringUtils.endsWith(canonicalizedUrl, "?/")) {
            canonicalizedUrl = canonicalizedUrl.slice(0, -2);
        } else if (StringUtils.endsWith(canonicalizedUrl, "?")) {
            canonicalizedUrl = canonicalizedUrl.slice(0, -1);
        }

        if (!StringUtils.endsWith(canonicalizedUrl, "/")) {
            canonicalizedUrl += "/";
        }

        return canonicalizedUrl;
    }
}

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
 * Normalizes URLs for comparison per RFC 3986 standards:
 * - Scheme and host are lowercased (case-insensitive per spec)
 * - Path and query parameters preserve original casing (case-sensitive per spec)
 * - Hash/fragment is removed
 * - Percent-encoding is normalized consistently via the URL API
 * This ensures that base64-encoded query param values and case-sensitive
 * path segments are not corrupted during URL comparison.
 * @param url - URL to normalize
 * @returns Normalized URL string for comparison
 */
export function normalizeUrlForComparison(url: string): string {
    if (!url) {
        return url;
    }

    // Remove hash first
    const urlWithoutHash = url.split("#")[0];

    try {
        // Parse the URL to normalize encoding consistently
        const urlObj = new URL(urlWithoutHash);

        // Reconstruct and canonicalize per RFC 3986 via canonicalizeUrl
        const normalizedUrl = urlObj.origin + urlObj.pathname + urlObj.search;

        return canonicalizeUrl(normalizedUrl);
    } catch (e) {
        // Fallback for malformed URLs
        return canonicalizeUrl(urlWithoutHash);
    }
}
