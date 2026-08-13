/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ParsedUrlError } from "../../../error/ParsedUrlError.js";
import { InvalidUrl } from "../../../error/ParsedUrlErrorCodes.js";

const API_MARKERS = ["/api/", "/oauth2/"];

/*
 * Resolves a server-provided HAL `_links` href into an absolute URL against the configured base
 * authority. V2 is server-driven, so most steps follow hrefs returned by the server; those may be
 * absolute or host-relative. Absolute http(s) hrefs pass through unchanged. A relative href carries
 * its own tenant segment, which is dropped and replaced by the base authority's tenant path so the
 * request stays anchored on the configured authority; only the API tail (from `/api/` or `/oauth2/`
 * onward) is taken from the href, and the href's own query string (e.g. `?dc=...`) is preserved.
 *
 * Example:
 *   base = https://login.microsoftonline.com/common
 *   href = /1eb974cd-.../api/v0.1/auth/methods/email/3f7/verify?dc=ESTS-PUB
 *    ->    https://login.microsoftonline.com/common/api/v0.1/auth/methods/email/3f7/verify?dc=ESTS-PUB
 */
export function resolveHref(base: URL, href: string): URL {
    const trimmed = href.trim();

    const absolute = tryParseAbsolute(trimmed);

    if (absolute) {
        return absolute;
    }

    /*
     * Parse the relative href's path + query against the authority host, then rewrite the path to
     * the authority's tenant path plus the href's API tail.
     */
    let resolved: URL;

    try {
        resolved = new URL(trimmed, base.origin);
    } catch (e) {
        throw new ParsedUrlError(
            InvalidUrl,
            `The HAL href "${href}" could not be resolved: ${e}`
        );
    }

    const tenantPath = base.pathname.endsWith("/")
        ? base.pathname.slice(0, -1)
        : base.pathname;

    resolved.pathname = tenantPath + apiPath(resolved.pathname);

    return resolved;
}

// Absolute http(s) href: use as-is. Returns undefined when the value is not absolute.
function tryParseAbsolute(href: string): URL | undefined {
    try {
        const url = new URL(href);

        return url.protocol === "http:" || url.protocol === "https:"
            ? url
            : undefined;
    } catch {
        return undefined;
    }
}

/*
 * The API portion of a server href path, dropping any leading tenant segment. Everything from the
 * `/api/` (or `/oauth2/`) marker onward is kept; a path without a marker is returned as-is.
 */
function apiPath(path: string): string {
    for (const marker of API_MARKERS) {
        const index = path.indexOf(marker);

        if (index >= 0) {
            return path.slice(index);
        }
    }

    return path.startsWith("/") ? path : `/${path}`;
}
