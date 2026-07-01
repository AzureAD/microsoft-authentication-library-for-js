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
};

type PopupRelayRequest = { id: string } & (
    | { method: "GET"; url: string }
    | { method: "POST"; action: string; fields: Record<string, string> }
);

const DEFAULT_POPUP_RELAY_TIMEOUT_MS = 300000;
const DEFAULT_POPUP_RELAY_WIDTH = 520;
const DEFAULT_POPUP_RELAY_HEIGHT = 640;

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
 *   2. Opens the IdP child popup and performs that navigation (the relay page
 *      stays put, so its `window.opener` link back to the embedded frame
 *      survives COOP).
 *   3. Waits for the child's redirect URI page (which must run the redirect
 *      bridge, `broadcastResponseToMainFrame`) to broadcast the raw auth
 *      response over a same-origin `BroadcastChannel`.
 *   4. Relays that raw response back to the embedded frame via
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

    let request: PopupRelayRequest;
    try {
        request = JSON.parse(rawReq) as PopupRelayRequest;
    } catch (e) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            "",
            "popup_relay_bad_request"
        );
    }
    if (!request || !request.id) {
        throw createBrowserAuthError(
            BrowserAuthErrorCodes.popupRelayUnsupportedFlow,
            "",
            "popup_relay_bad_request"
        );
    }

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
