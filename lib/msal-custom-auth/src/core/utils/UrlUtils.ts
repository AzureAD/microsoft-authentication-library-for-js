/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    InvalidUrl,
    ParsedUrlError,
    UnsecureUrl,
} from "../error/ParsedUrlError.js";

export class UrlUtils {
    /**
     * Validates whether a given URL is valid.
     * @param url The target URL to validate
     * @returns The result of the URL validation
     */
    static IsValidSecureUrl(url: string): boolean {
        try {
            const urlComponents = new URL(url);

            if (urlComponents.protocol !== "https:") {
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Parses a URL string into a URL object.
     * @param url The URL to parse
     * @returns The parsed URL object
     */
    static parseUrl(url: string): URL {
        try {
            return new URL(url);
        } catch (e) {
            throw new ParsedUrlError(
                InvalidUrl,
                `The URL "${url}" is invalid: ${e}`
            );
        }
    }

    /**
     * Parses a URL string into a URL object and ensure its protocol is HTTPS.
     * @param url The URL to parse
     * @returns The parsed URL object
     */
    static parseSecureUrl(url: string): URL {
        const parsedUrl = this.parseUrl(url);

        if (parsedUrl.protocol !== "https:") {
            throw new ParsedUrlError(
                UnsecureUrl,
                `The URL "${url}" is not secure. Only HTTPS URLs are supported.`
            );
        }

        return parsedUrl;
    }
}
