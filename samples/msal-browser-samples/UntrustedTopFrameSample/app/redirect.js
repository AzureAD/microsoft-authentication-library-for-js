/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * OAuth redirect page — the registered SPA redirect URI AND the post-logout
 * redirect URI. The relay page's IdP child popup lands here after an
 * authorization code is issued (sign-in) or after the end-session request
 * completes (sign-out). The MSAL redirect bridge parses whatever is on the URL
 * (the auth code, or just the returned state for logout) and broadcasts it
 * (same-origin) back to the relay page, which relays it to the embedded iframe.
 * The bridge also scrubs the response from this page's URL. No app-specific
 * relay code is needed.
 */
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

(function () {
    "use strict";

    const statusEl = document.getElementById("status");
    statusEl.textContent = "Completing… you can close this window.";

    broadcastResponseToMainFrame().catch(function (error) {
        console.error("Failed to relay auth response:", error);
        statusEl.textContent = "This window could not be completed.";
    });
})();
