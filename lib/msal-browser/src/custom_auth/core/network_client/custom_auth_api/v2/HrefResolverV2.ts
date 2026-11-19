/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ParsedUrlError } from "../../../error/ParsedUrlError.js";
import { InvalidUrl } from "../../../error/ParsedUrlErrorCodes.js";

export function resolveHrefV2(base: URL, href: string): URL {
    const trimmed = href.trim();

    if (!trimmed) {
        throw new ParsedUrlError(InvalidUrl, "The HAL href cannot be empty");
    }

    let resolved: URL;

    try {
        let path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
        const lowerHref = trimmed.toLowerCase();
        if (
            lowerHref.startsWith("https://") ||
            lowerHref.startsWith("http://")
        ) {
            const absoluteHref = new URL(trimmed);
            path = `${absoluteHref.pathname}${absoluteHref.search}${absoluteHref.hash}`;
        }
        resolved = new URL(`${base.origin}${path}`);
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

    return resolved;
}
