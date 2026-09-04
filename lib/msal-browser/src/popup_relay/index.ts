/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { POPUP_RELAY_RESPONSE_TYPE } from "./constants.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import { createForm } from "../protocol/Authorize.js";
import { PopupWindowAttributes } from "../request/PopupWindowAttributes.js";

/** Options for {@link runPopupRelay}. */
export type PopupRelayOptions = {
    /**
     * Sizing/positioning for the IdP child popup the relay page opens. Same
     * shape as `PopupRequest.popupWindowAttributes` (`popupSize` with width and
     * height, `popupPosition` with top and left). Defaults to a 520x640 window.
     */
    popupWindowAttributes?: PopupWindowAttributes;
    /**
     * How long (ms) to wait for the IdP child popup to deliver a response
     * before giving up. Defaults to 300000 (5 minutes).
     */
    timeoutMs?: number;
    /**
     * Origins the relay is allowed to navigate its IdP child popup to, e.g.
     * `["https://login.microsoftonline.com"]`. Strongly recommended: set this
     * to the origin(s) of the authority your app signs in against, so the relay
     * page can only ever be used to reach your identity provider.
     *
     * Entries are compared by origin, so passing the full configured authority
     * (`"https://login.microsoftonline.com/common"`), a trailing slash, mixed
     * case, or an explicit `:443` all work.
     *
     * **Optional — omitting it does not disable the relay.** The relay page
     * always rejects non-`https:` navigation targets; this option additionally
     * pins *which* https origins are acceptable. When omitted, any https origin
     * is allowed, which is how every existing relay page already behaves.
     * Passing an explicitly empty array means "allow nothing" and will reject
     * every navigation.
     */
    allowedAuthorityOrigins?: string[];
};

type PopupRelayRequest = { id: string } & (
    | { method: "GET"; url: string }
    | { method: "POST"; action: string; fields: Record<string, string> }
);

const DEFAULT_POPUP_RELAY_TIMEOUT_MS = 300000;
const DEFAULT_POPUP_RELAY_WIDTH = 520;
const DEFAULT_POPUP_RELAY_HEIGHT = 640;

const BAD_REQUEST_SUBERROR = "popup_relay_bad_request";
const UNSAFE_URL_SUBERROR = "popup_relay_unsafe_url";
const UNTRUSTED_AUTHORITY_SUBERROR = "popup_relay_untrusted_authority";
const INVALID_ALLOWED_ORIGIN_SUBERROR = "popup_relay_invalid_allowed_origin";

function throwRelayError(subError: string): never {
    throw createBrowserAuthError(
        BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
        "",
        subError
    );
}

function tryParseUrl(raw: string): URL | null {
    try {
        return new URL(raw);
    } catch (e) {
        return null;
    }
}

/**
 * Reduces each configured allow-list entry to its origin so the comparison is
 * robust to the shapes a developer naturally reaches for. Passing the
 * configured authority (`https://login.microsoftonline.com/common`), a trailing
 * slash, mixed case, or an explicit default port all normalize to the same
 * origin the navigation target is compared against.
 *
 * A malformed entry is a configuration bug in the relay page, and silently
 * dropping it would quietly change the size of the allow list, so it fails
 * loudly instead.
 */
function normalizeAllowedOrigins(allowedAuthorityOrigins: string[]): string[] {
    return allowedAuthorityOrigins.map((entry) => {
        const parsed = typeof entry === "string" ? tryParseUrl(entry) : null;
        if (
            !parsed ||
            parsed.protocol !== "https:" ||
            parsed.username ||
            parsed.password
        ) {
            throwRelayError(INVALID_ALLOWED_ORIGIN_SUBERROR);
        }
        return parsed.origin;
    });
}

/**
 * Validates a navigation target taken from the relay page's hash before it can
 * reach `window.open` or a form `action`.
 *
 * The hash is *not* authority: anyone can craft a link to the deployed relay
 * page, so a target must be proven safe rather than assumed to have been built
 * by MSAL. Only absolute `https:` URLs without embedded credentials are
 * accepted, which rules out active/local schemes (`javascript:`, `data:`,
 * `blob:`, `vbscript:`, `file:`) that would otherwise execute in — or read
 * from — the relay page's own first-party security origin. `https:`-only also
 * matches the scheme MSAL already requires of an authority, so it cannot reject
 * a navigation MSAL would have been willing to build.
 *
 * When `allowedAuthorityOrigins` is omitted the origin check is skipped and any
 * https target is accepted — the behavior every relay page had before this
 * validation existed. An explicitly empty array means "allow nothing" and is
 * honored as such rather than being treated as "unset".
 */
function validateNavigationTarget(
    raw: unknown,
    allowedAuthorityOrigins?: string[]
): string {
    if (typeof raw !== "string" || !raw) {
        throwRelayError(BAD_REQUEST_SUBERROR);
    }
    const parsed = tryParseUrl(raw);
    if (
        !parsed ||
        parsed.protocol !== "https:" ||
        parsed.username ||
        parsed.password
    ) {
        throwRelayError(UNSAFE_URL_SUBERROR);
    }
    if (
        allowedAuthorityOrigins !== undefined &&
        !Array.isArray(allowedAuthorityOrigins)
    ) {
        throwRelayError(INVALID_ALLOWED_ORIGIN_SUBERROR);
    }

    const normalizedAllowedOrigins =
        allowedAuthorityOrigins === undefined
            ? undefined
            : normalizeAllowedOrigins(allowedAuthorityOrigins);

    if (
        normalizedAllowedOrigins &&
        normalizedAllowedOrigins.indexOf(parsed.origin) < 0
    ) {
        throwRelayError(UNTRUSTED_AUTHORITY_SUBERROR);
    }
    /*
     * Return the original string rather than `parsed.href`: `window.open` and
     * `form.action` resolve it with the same URL parser used here, so the
     * navigation is byte-identical to what MSAL built and no normalization can
     * alter an authority's query encoding.
     */
    return raw;
}

/**
 * Parses and fully validates the relayed request carried in the relay page's
 * hash. Every field is treated as attacker-controlled: the shape is checked
 * exactly (no implicit GET fallback for an unknown `method`) and both
 * navigation targets — the GET `url` and the POST `action` — are run through
 * {@link validateNavigationTarget}.
 */
function parseRelayRequest(
    rawReq: string,
    allowedAuthorityOrigins?: string[]
): PopupRelayRequest {
    let parsed;
    try {
        parsed = JSON.parse(rawReq);
    } catch (e) {
        parsed = null;
    }
    if (typeof parsed !== "object" || parsed === null) {
        throwRelayError(BAD_REQUEST_SUBERROR);
    }

    const request = parsed as Record<string, unknown>;
    const id = request.id;
    if (typeof id !== "string" || !id) {
        throwRelayError(BAD_REQUEST_SUBERROR);
    }

    if (request.method === "GET") {
        return {
            id,
            method: "GET",
            url: validateNavigationTarget(request.url, allowedAuthorityOrigins),
        };
    }

    if (request.method === "POST") {
        const action = validateNavigationTarget(
            request.action,
            allowedAuthorityOrigins
        );
        const rawFields = request.fields;
        if (
            typeof rawFields !== "object" ||
            rawFields === null ||
            Array.isArray(rawFields)
        ) {
            throwRelayError(BAD_REQUEST_SUBERROR);
        }
        const fields: Record<string, string> = {};
        Object.keys(rawFields).forEach((name) => {
            const value = (rawFields as Record<string, unknown>)[name];
            if (typeof value !== "string") {
                throwRelayError(BAD_REQUEST_SUBERROR);
            }
            fields[name] = value;
        });
        return { id, method: "POST", action, fields };
    }

    return throwRelayError(BAD_REQUEST_SUBERROR);
}

/**
 * Builds the `window.open` features string for the IdP child popup from a
 * {@link PopupWindowAttributes}, mirroring the shape used by
 * `PopupRequest.popupWindowAttributes`.
 */
function buildChildPopupFeatures(attributes?: PopupWindowAttributes): string {
    const width = attributes?.popupSize?.width || DEFAULT_POPUP_RELAY_WIDTH;
    const height = attributes?.popupSize?.height || DEFAULT_POPUP_RELAY_HEIGHT;
    const features = [`width=${width}`, `height=${height}`];
    if (attributes?.popupPosition?.top !== undefined) {
        features.push(`top=${attributes.popupPosition.top}`);
    }
    if (attributes?.popupPosition?.left !== undefined) {
        features.push(`left=${attributes.popupPosition.left}`);
    }
    features.push("scrollbars=yes");
    return features.join(",");
}

/**
 * Entry point for the top-level "popup-relay" page referenced by
 * `auth.popupRelayUri`. Call this from the relay page (which MSAL opens as a
 * top-level popup from inside an embedded, cross-origin iframe). It:
 *
 *   1. Reads the IdP navigation MSAL passed in this page's hash (a GET URL, or a
 *      POST form for the form_post / EAR response modes), then scrubs the hash.
 *   2. Validates that navigation. The relay page is directly reachable, so the
 *      hash is untrusted input: the request shape is checked exactly and the
 *      navigation target must be an absolute `https:` URL (optionally pinned to
 *      {@link PopupRelayOptions.allowedAuthorityOrigins}). Anything else — in
 *      particular active schemes such as `javascript:` — is rejected before it
 *      can reach `window.open` or a form `action`.
 *   3. Opens the IdP child popup and performs that navigation (the relay page
 *      stays put, so its `window.opener` link back to the embedded frame
 *      survives COOP).
 *   4. Waits for the child's redirect URI page (which must run the redirect
 *      bridge, `broadcastResponseToMainFrame`) to broadcast the raw auth
 *      response over a same-origin `BroadcastChannel`.
 *   5. Relays that raw response back to the embedded frame via
 *      `opener.postMessage`, posting only to its own (same) origin, then closes.
 *
 * The embedded frame keeps the PKCE verifier (and EAR private key) and exchanges
 * the relayed response itself — no token, verifier, or private key ever crosses
 * a window boundary.
 *
 * Note: the child popup is opened when this function runs, so call it from a
 * user gesture (e.g. a "Continue" button click) to avoid popup blockers.
 *
 * @param options - {@link PopupRelayOptions}
 */
export function runPopupRelay(options?: PopupRelayOptions): void {
    const opener = window.opener as Window | null;
    const targetOrigin = window.location.origin;

    const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
    );
    const rawReq = hashParams.get("req") || "";

    // Scrub the relayed request out of the relay page's own URL immediately.
    if (typeof window.history.replaceState === "function") {
        window.history.replaceState(
            null,
            "",
            window.location.origin + window.location.pathname
        );
    }

    if (!opener) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            "",
            "popup_relay_no_opener"
        );
    }

    /*
     * Validate everything before opening anything: the relay page is directly
     * reachable, so the hash is attacker-controlled input, not authority.
     */
    const request = parseRelayRequest(rawReq, options?.allowedAuthorityOrigins);

    const id = request.id;
    const channel = new BroadcastChannel(id);
    let settled = false;
    /*
     * Timer handles are kept on a const holder so relay() (declared before the
     * timers are created) can clear them — `let` handles trip prefer-const, and
     * `const` handles can't be referenced before assignment (TDZ).
     */
    const timers: {
        closedPoll?: number;
        timeoutId?: number;
    } = {};

    const relay = (message: { payload?: string; error?: string }): void => {
        if (settled) {
            return;
        }
        settled = true;
        try {
            channel.close();
        } catch (e) {
            /* ignore */
        }
        clearInterval(timers.closedPoll);
        clearTimeout(timers.timeoutId);
        opener.postMessage(
            { type: POPUP_RELAY_RESPONSE_TYPE, id, ...message },
            targetOrigin
        );
        setTimeout(() => {
            try {
                window.close();
            } catch (e) {
                /* ignore */
            }
        }, 0);
    };

    // The redirect bridge broadcasts the raw auth response payload here.
    channel.onmessage = (event: MessageEvent): void => {
        const payload = event.data && event.data.payload;
        if (payload) {
            relay({ payload });
        }
    };

    const features = buildChildPopupFeatures(options?.popupWindowAttributes);
    const childPopup =
        request.method === "POST"
            ? window.open("about:blank", "msalPopupRelayChild", features)
            : window.open(request.url, "msalPopupRelayChild", features);

    if (!childPopup) {
        relay({ error: BrowserAuthErrorCodes.popupWindowError });
        return;
    }

    if (request.method === "POST") {
        createForm(
            childPopup.document,
            request.action,
            request.fields
        ).submit();
    }

    timers.closedPoll = window.setInterval(() => {
        if (childPopup.closed && !settled) {
            /*
             * The popup is gone, so the overall timeout no longer applies —
             * drop it and report cancellation. A successful sign-in settles
             * first: the redirect bridge broadcasts the response before it
             * closes the popup, so onmessage runs on the
             * next event-loop turn, well before this 500ms poll observes the
             * close — the `!settled` guard then skips cancellation.
             */
            clearTimeout(timers.timeoutId);
            relay({ error: BrowserAuthErrorCodes.userCancelled });
        }
    }, 500);

    timers.timeoutId = window.setTimeout(() => {
        if (!settled) {
            /*
             * Stop the close poll before we close the popup ourselves, so it
             * can't observe the close and report user_cancelled instead.
             */
            clearInterval(timers.closedPoll);
            try {
                childPopup.close();
            } catch (e) {
                /* ignore */
            }
            relay({ error: BrowserAuthErrorCodes.timedOut });
        }
    }, options?.timeoutMs || DEFAULT_POPUP_RELAY_TIMEOUT_MS);
}
