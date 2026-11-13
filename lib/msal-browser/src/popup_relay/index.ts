/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    POPUP_RELAY_READY_TYPE,
    POPUP_RELAY_REQUEST_TYPE,
    POPUP_RELAY_RESPONSE_TYPE,
    POPUP_RELAY_V2_RESPONSE_TYPE,
    getPopupRelayProtocolVersion,
} from "./constants.js";
import {
    BrowserAuthError,
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import { createForm } from "../protocol/Authorize.js";
import { PopupWindowAttributes } from "../request/PopupWindowAttributes.js";
import { createNewGuid } from "../crypto/BrowserCrypto.js";

/** Options for {@link runPopupRelay}. */
export type PopupRelayOptions = {
    /**
     * Wire protocol accepted by this endpoint. Defaults to 1 to preserve
     * existing relay deployments. Version 1 is deprecated due to security
     * concerns: URL-fragment descriptors do not authenticate their provenance.
     * Deploy a separate endpoint with version 2 for authenticated handoff,
     * then retire the v1 endpoint.
     */
    protocolVersion?: 1 | 2;
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
     * is allowed. V1 is deprecated due to security concerns: it accepts
     * unauthenticated fragment descriptors and retains the legacy
     * arbitrary-navigation risk until the endpoint is retired. V2 requires an
     * authenticated opener request even when this option is omitted.
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
 * Validates a navigation target before it can
 * reach `window.open` or a form `action`.
 *
 * Only absolute `https:` URLs without embedded credentials are
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
 * Fully validates a v1 descriptor or an authenticated v2 request. The shape
 * is checked exactly (no implicit GET fallback for an unknown `method`) and both
 * navigation targets — the GET `url` and the POST `action` — are run through
 * {@link validateNavigationTarget}.
 */
function parseRelayRequest(
    rawReq: unknown,
    allowedAuthorityOrigins?: string[]
): PopupRelayRequest {
    if (typeof rawReq !== "object" || rawReq === null) {
        throwRelayError(BAD_REQUEST_SUBERROR);
    }

    const request = rawReq as Record<string, unknown>;
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
 * top-level popup from inside an embedded, cross-origin iframe).
 *
 * V1 (the compatibility default) is deprecated due to security concerns. It
 * executes validated but unauthenticated fragment descriptors and returns the
 * legacy response envelope. It retains the legacy risk when origins are not
 * pinned; retire that endpoint after migrating callers.
 *
 * V2 must be explicitly selected on both the app and its separate relay
 * endpoint. It:
 *
 *   1. Reads the request id from the hash, then scrubs the hash. Navigation
 *      descriptors in the hash are never executed.
 *   2. Reserves a blank child popup during the user gesture, then requests the
 *      navigation from the opener through an origin- and source-checked
 *      postMessage handoff bound to this relay document's nonce.
 *   3. Validates and performs the authenticated navigation (the relay page
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
    const protocolVersion = getPopupRelayProtocolVersion(
        options?.protocolVersion
    );
    const opener = window.opener as Window | null;
    const targetOrigin = window.location.origin;

    const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
    );
    const incomingVersion = hashParams.has("id") ? 2 : 1;
    let legacyDescriptor: unknown;
    if (incomingVersion === 1) {
        try {
            legacyDescriptor = JSON.parse(hashParams.get("req") || "");
        } catch {
            legacyDescriptor = null;
        }
    }
    let id: unknown = hashParams.get("id") || "";
    if (
        incomingVersion === 1 &&
        legacyDescriptor &&
        typeof legacyDescriptor === "object" &&
        "id" in legacyDescriptor
    ) {
        id = legacyDescriptor.id;
    }

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

    if (typeof id !== "string" || !id) {
        throwRelayError(BAD_REQUEST_SUBERROR);
    }

    if (incomingVersion !== protocolVersion) {
        const error = createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            "",
            "popup_relay_protocol_mismatch"
        );
        opener.postMessage(
            {
                type:
                    incomingVersion === 1
                        ? POPUP_RELAY_RESPONSE_TYPE
                        : POPUP_RELAY_V2_RESPONSE_TYPE,
                id,
                error: error.errorCode,
                subError: error.subError,
            },
            targetOrigin
        );
        throw error;
    }

    const legacyRequest =
        protocolVersion === 1
            ? parseRelayRequest(
                  legacyDescriptor,
                  options?.allowedAuthorityOrigins
              )
            : undefined;
    const nonce = protocolVersion === 2 ? createNewGuid() : undefined;
    const channel = new BroadcastChannel(id);
    let settled = false;
    let requestReceived = protocolVersion === 1;
    /*
     * Timer handles are kept on a const holder so relay() (declared before the
     * timers are created) can clear them — `let` handles trip prefer-const, and
     * `const` handles can't be referenced before assignment (TDZ).
     */
    const timers: {
        closedPoll?: number;
        timeoutId?: number;
    } = {};

    const relay = (message: {
        payload?: string;
        error?: string;
        subError?: string;
    }): void => {
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
        window.removeEventListener("message", onRequest);
        window.removeEventListener("pagehide", onPageHide);
        opener.postMessage(
            {
                type:
                    protocolVersion === 1
                        ? POPUP_RELAY_RESPONSE_TYPE
                        : POPUP_RELAY_V2_RESPONSE_TYPE,
                id,
                ...(protocolVersion === 2 ? { nonce } : {}),
                ...message,
            },
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
        if (requestReceived && payload) {
            relay({ payload });
        }
    };

    const onRequest = (event: MessageEvent): void => {
        const data = event.data;
        if (
            settled ||
            requestReceived ||
            protocolVersion !== 2 ||
            !childPopup ||
            event.origin !== targetOrigin ||
            event.source !== opener ||
            !data ||
            data.type !== POPUP_RELAY_REQUEST_TYPE ||
            data.id !== id ||
            data.nonce !== nonce
        ) {
            return;
        }
        window.removeEventListener("message", onRequest);
        try {
            const request = parseRelayRequest(
                data.request,
                options?.allowedAuthorityOrigins
            );
            if (request.id !== id) {
                throwRelayError(BAD_REQUEST_SUBERROR);
            }
            requestReceived = true;
            if (request.method === "GET") {
                childPopup.location.replace(request.url);
            } else {
                createForm(
                    childPopup.document,
                    request.action,
                    request.fields
                ).submit();
            }
        } catch (e) {
            relay({
                error:
                    e instanceof BrowserAuthError
                        ? e.errorCode
                        : BrowserAuthErrorCodes.popupWindowError,
                subError:
                    e instanceof BrowserAuthError
                        ? e.subError
                        : "popup_relay_navigation_failed",
            });
            childPopup.close();
        }
    };

    const features = buildChildPopupFeatures(options?.popupWindowAttributes);
    // Reserve a fresh window before the asynchronous handoff consumes activation.
    const childPopup =
        legacyRequest?.method === "GET"
            ? window.open(legacyRequest.url, "msalPopupRelayChild", features)
            : window.open(
                  "about:blank",
                  protocolVersion === 1 ? "msalPopupRelayChild" : "_blank",
                  features
              );

    if (!childPopup) {
        relay({ error: BrowserAuthErrorCodes.popupWindowError });
        return;
    }

    function onPageHide(): void {
        settled = true;
        window.removeEventListener("message", onRequest);
        window.removeEventListener("pagehide", onPageHide);
        clearInterval(timers.closedPoll);
        clearTimeout(timers.timeoutId);
        channel.close();
        childPopup?.close();
    }
    if (protocolVersion === 2) {
        window.addEventListener("message", onRequest);
    } else if (legacyRequest?.method === "POST") {
        createForm(
            childPopup.document,
            legacyRequest.action,
            legacyRequest.fields
        ).submit();
    }
    window.addEventListener("pagehide", onPageHide);

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
            relay({
                error: BrowserAuthErrorCodes.timedOut,
                subError: requestReceived
                    ? undefined
                    : "popup_relay_handshake_timeout",
            });
        }
    }, options?.timeoutMs || DEFAULT_POPUP_RELAY_TIMEOUT_MS);

    if (protocolVersion === 2) {
        opener.postMessage(
            { type: POPUP_RELAY_READY_TYPE, id, nonce },
            targetOrigin
        );
    }
}
