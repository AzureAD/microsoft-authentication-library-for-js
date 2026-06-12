/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthorizeResponse } from "../response/AuthorizeResponse.js";
import {
    ClientAuthErrorCodes,
    createClientAuthError,
} from "../error/ClientAuthError.js";
import {
    ClientConfigurationErrorCodes,
    createClientConfigurationError,
} from "../error/ClientConfigurationError.js";
import { Logger } from "../logger/Logger.js";

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
 * Throws a urlParseError if the provided URL is malformed and cannot be parsed.
 * @param url - URL to normalize
 * @param logger - Optional logger used to log parse failures
 * @param correlationId - Optional correlationId associated with the log entry
 * @returns Normalized URL string for comparison
 */
export function normalizeUrlForComparison(
    url: string,
    logger?: Logger,
    correlationId?: string
): string {
    if (!url) {
        return url;
    }

    const urlWithoutHash = url.split("#")[0];
    if (!urlWithoutHash) {
        return urlWithoutHash;
    }

    try {
        const urlObj = new URL(urlWithoutHash);

        // Treat an empty query string (a bare trailing "?") as equivalent to no query
        if (!urlObj.search) {
            urlObj.search = "";
        }

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

        return urlObj.href;
    } catch (e) {
        logger?.error(
            `Failed to normalize URL for comparison: '${e}'`,
            correlationId || ""
        );
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.urlParseError
        );
    }
}

/**
 * Validates that the provided value is a well-formed, parseable absolute URL.
 * Throws a urlParseError if the value cannot be parsed by the URL API (e.g. the
 * literal string "null", an empty string, or any malformed/relative URL). Use this
 * to guard against persisting an invalid value (such as a redirect URL) to the cache.
 * @param url - URL to validate
 * @param logger - Optional logger used to log validation failures
 * @param correlationId - Optional correlationId associated with the log entry
 */
export function validateUrl(
    url: string,
    logger?: Logger,
    correlationId?: string
): void {
    try {
        new URL(url);
    } catch (e) {
        logger?.error(`Failed to validate URL: '${e}'`, correlationId || "");
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.urlParseError
        );
    }
}
