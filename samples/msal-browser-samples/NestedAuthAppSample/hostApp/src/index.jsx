import React from "react";
import ReactDOM from "react-dom/client";
import {
    createStandardPublicClientApplication,
    EventType,
} from "@azure/msal-browser";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";
import {
    msalConfig,
    nestedAppPort,
    nestedAppProtocol,
} from "./authConfig";
import { installHostNestedAppAuthBridge } from "./nestedAppAuthBridge";
import App from "./App";

/*
 * When the platform broker (Microsoft SSO extension) is unavailable, MSAL falls
 * back to the standard interactive popup (web authentication) flow. In MSAL v5
 * that flow lands the auth response on the app's redirect URI inside the popup
 * (or a silent iframe), and that landing page must relay the response back to
 * the main window via `broadcastResponseToMainFrame()` (over a BroadcastChannel)
 * — without first bootstrapping a PublicClientApplication, which would consume
 * the response hash before it can be broadcast.
 *
 * We gate solely on the presence of an auth response in the URL: this
 * popup-only sample never loads the host top-level with a `code`/`state`, so any
 * such load is a redirect landing. We deliberately do NOT gate on
 * `window.opener`, because ESTS's COOP headers sever the opener reference in the
 * popup — which is exactly why the bridge relays over a BroadcastChannel.
 */
const isAuthResponseInUrl = /[?#].*(code=|error=|state=)/.test(
    window.location.href
);

if (isAuthResponseInUrl) {
    broadcastResponseToMainFrame().catch((error) => {
        console.error("Error broadcasting auth response to main frame:", error);
    });
} else {
    // The host initializes MSAL with the platform broker enabled and acts as the
    // Nested App Authentication host for the embedded nested app.
    createStandardPublicClientApplication(msalConfig).then((pca) => {
        if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
            pca.setActiveAccount(pca.getAllAccounts()[0]);
        }

        pca.addEventCallback((event) => {
            if (
                event.eventType === EventType.LOGIN_SUCCESS &&
                event.payload?.account
            ) {
                pca.setActiveAccount(event.payload.account);
            }
        });

        // Act as the Nested App Authentication bridge provider for the embedded
        // nested app served from this origin.
        const nestedOrigin = `${nestedAppProtocol}://localhost:${nestedAppPort}`;
        installHostNestedAppAuthBridge(pca, nestedOrigin);

        const container = document.getElementById("root");
        const root = ReactDOM.createRoot(container);
        root.render(<App pca={pca} />);
    });
}
