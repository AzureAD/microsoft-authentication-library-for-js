/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { BrowserConfiguration } from "../config/Configuration.js";

/**
 * `window.origin` of a document with an opaque origin, e.g. one sandboxed
 * without `allow-same-origin`. Read from `window.origin`, not
 * `location.origin`, which reports the real host even when sandboxed.
 */
const OPAQUE_ORIGIN = "null";

/**
 * Returns `true` when every ancestor browsing context is same-origin with
 * `win`. A top-level document has no ancestors, so it always passes.
 */
export function allAncestorsSameOrigin(win: Window): boolean {
    // Sandboxed: no origin to compare ancestors against.
    if (win.origin === OPAQUE_ORIGIN) {
        return false;
    }

    try {
        let current: Window = win;
        // `window.parent` is self-referential at the top level, never falsy.
        while (current !== current.parent) {
            current = current.parent;
            // Throws SecurityError if this ancestor is cross-origin.
            void current.location.href;
        }
        return true;
    } catch {
        return false;
    }
}

/**
 * Returns `true` when the top-level window has no opener, or one that is
 * same-origin with it.
 *
 * Reads the opener from `win.top`, not `win`: a framed document always reports
 * `window.opener === null` and would pass while the top window's untrusted
 * opener still holds a handle on it.
 */
export function topOpenerIsSameOriginOrAbsent(win: Window): boolean {
    try {
        const top = win.top;
        if (!top) {
            // Detached from its browsing context; treat as unsafe.
            return false;
        }

        const opener = top.opener as Window | null | undefined;
        if (!opener || opener === top) {
            return true;
        }

        // Throws SecurityError if the opener is cross-origin.
        void opener.location.href;
        return true;
    } catch {
        return false;
    }
}

/**
 * Computes the `pocd` ("popup origin check done") authorize parameter value.
 *
 * `1` means no untrusted window can reach the popup, which is what lets Entra
 * omit the `Cross-Origin-Opener-Policy` response header for the request.
 *
 * @param config Resolved browser configuration.
 * @returns `1` when the check passes, otherwise `0`.
 */
export function computePocd(config: BrowserConfiguration): 0 | 1 {
    /*
     * Only an explicit false opts out; anything else computes the check, so an
     * unresolved config fails closed rather than asserting pocd=1.
     */
    if (config.auth.originCheck === false) {
        return 1;
    }

    if (typeof window === "undefined" || !allAncestorsSameOrigin(window)) {
        return 0;
    }

    return topOpenerIsSameOriginOrAbsent(window) ? 1 : 0;
}
