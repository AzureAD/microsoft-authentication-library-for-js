/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Top-level POPUP-RELAY page (trusted origin), referenced by
 * `auth.popupRelayUri`. MSAL (running in the embedded iframe) opens this page as
 * a top-level popup with the /authorize navigation in the hash. runPopupRelay
 * opens the IdP child popup, waits for the redirect bridge on /redirect to
 * broadcast the response, and relays it back to the iframe — all inside MSAL.
 * Being top-level and first-party, this page can run the interactive step the
 * partitioned iframe cannot, and its window.opener link back to the iframe
 * survives COOP because it never navigates itself to the IdP.
 *
 * The child popup is opened on a click so popup blockers don't block it.
 */
import { runPopupRelay } from "@azure/msal-browser/popup-relay";

(function () {
    "use strict";

    const statusEl = document.getElementById("status");
    const continueBtn = document.getElementById("continue");

    continueBtn.addEventListener("click", function () {
        continueBtn.disabled = true;
        statusEl.textContent = "Contacting Microsoft...";
        try {
            runPopupRelay();
        } catch (e) {
            statusEl.textContent =
                "Sign-in unavailable: " + (e && e.message ? e.message : e);
            continueBtn.disabled = false;
        }
    });

    statusEl.textContent = "Ready.";
})();
