/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { POPUP_RELAY_RESPONSE_TYPE } from "./constants.js";
import {
    BrowserAuthErrorCodes,
    createBrowserAuthError,
} from "../error/BrowserAuthError.js";
import { createForm } from "../utils/BrowserUtils.js";

/** Options for {@link runPopupRelay}. */
export type PopupRelayOptions = {
    /**
     * Window features string for the IdP child popup the relay page opens.
     * Defaults to a 520x640 window.
     */
    popupWindowFeatures?: string;
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
        clearInterval(closedPoll);
        clearTimeout(timeoutId);
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

    const features = options?.popupWindowFeatures || "width=520,height=640";
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

    const closedPoll = window.setInterval(() => {
        if (childPopup.closed && !settled) {
            relay({ error: BrowserAuthErrorCodes.userCancelled });
        }
    }, 500);

    const timeoutId = window.setTimeout(() => {
        if (!settled) {
            try {
                childPopup.close();
            } catch (e) {
                /* ignore */
            }
            relay({ error: BrowserAuthErrorCodes.timedOut });
        }
    }, options?.timeoutMs || DEFAULT_POPUP_RELAY_TIMEOUT_MS);
}
