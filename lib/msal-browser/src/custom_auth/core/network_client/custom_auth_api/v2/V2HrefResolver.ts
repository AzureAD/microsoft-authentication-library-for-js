/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ParsedUrlError } from "../../../error/ParsedUrlError.js";
import { InvalidUrl } from "../../../error/ParsedUrlErrorCodes.js";

const API_MARKERS = ["/api/", "/oauth2/"];

/*
 * Resolves a HAL href against the configured authority. Absolute HTTP(S) URLs
 * pass through; relative URLs retain their API path and query while using the
 * configured tenant path.
 *
 * TODO: Remove tenant-path rewriting once the service consistently returns links that can be
 * resolved directly against the configured authority.
 */
export function resolveHref(base: URL, href: string): URL {
    const trimmed = href.trim();

    if (!trimmed) {
        throw new ParsedUrlError(InvalidUrl, "The HAL href cannot be empty");
    }

    const absolute = tryParseAbsolute(trimmed);

    if (absolute) {
        return absolute;
    }

    let resolved: URL;

    try {
        resolved = new URL(trimmed, base.origin);
    } catch (e) {
        throw new ParsedUrlError(
            InvalidUrl,
            `The HAL href "${href}" could not be resolved: ${e}`
        );
    }

    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
        throw new ParsedUrlError(
            InvalidUrl,
            `The HAL href "${href}" must use the HTTP or HTTPS protocol`
        );
    }

    const tenantPath = base.pathname.endsWith("/")
        ? base.pathname.slice(0, -1)
        : base.pathname;

    resolved.pathname = tenantPath + apiPath(resolved.pathname);

    return resolved;
}

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

function apiPath(path: string): string {
    for (const marker of API_MARKERS) {
        const index = path.indexOf(marker);

        if (index >= 0) {
            return path.slice(index);
        }
    }

    return path.startsWith("/") ? path : `/${path}`;
}
