/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ProtocolUtils } from "@azure/msal-common/browser";
import { isInPopup } from "../utils/BrowserUtils.js";
import { base64Decode } from "../encode/Base64Decode.js";

export async function sendPopupPayloadToMainFrame(): Promise<void> {
    try {
        if (!isInPopup()) {
            throw new Error("Window is not a popup");
        }

        // 1) Determine which URL container carries the payload
        const hasHash =
            !!window.location.hash && window.location.hash.length > 1;
        const raw = hasHash ? window.location.hash : window.location.search;
        if (!raw) {
            throw new Error("No auth payload found on URL (hash or query)");
        }

        // Strip leading ? / #
        const payload = raw.substring(1);
        const params = new URLSearchParams(payload);

        const state = params.get("state");
        if (!state) {
            throw new Error("Missing state on redirect URL");
        }

        // 2) Remove the response from URL for security
        if (hasHash) {
            // Clear hash
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        } else {
            // Clear query string
            window.history.replaceState(null, "", window.location.pathname);
        }

        const { libraryState } = ProtocolUtils.parseRequestState(
            base64Decode,
            state
        );

        const { id } = libraryState;
        if (!id) {
            throw new Error("State is missing id attribute");
        }

        // 4) Send the raw URL payload to the main frame
        const channel = new BroadcastChannel(id);
        channel.postMessage({
            v: 1,
            state,
            payload,
        });
        channel.close();
    } finally {
        try {
            window.close();
        } catch {}
    }
}
