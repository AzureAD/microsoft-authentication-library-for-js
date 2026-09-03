/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 */

import { LogLevel } from "@azure/msal-browser";
import {
    CLIENT_ID,
    AUTHORITY,
    REDIRECT_URI,
    POST_LOGOUT_REDIRECT_URI,
    ESTS_TEST_SLICE,
} from "./constants.js";

/*
 * HTTP method for the /authorize request: ?httpMethod=GET|POST (default GET).
 * Lets the sample — and its E2E tests — exercise both /authorize request shapes
 * through the same relay:
 *   - GET:  the /authorize request is a GET navigation (auth code + PKCE)
 *   - POST: the /authorize request is submitted as a POST form
 * Both return to /redirect in the fragment, so the relay and redirect bridge
 * are method-agnostic.
 */
export const HTTP_METHOD = (
    new URLSearchParams(window.location.search).get("httpMethod") || "GET"
).toUpperCase();

export const EAR =
    new URLSearchParams(window.location.search).get("ear") === "true";

export const msalConfig = {
    auth: {
        clientId: CLIENT_ID,
        authority: AUTHORITY,
        redirectUri: REDIRECT_URI,
        postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI,
        // Top-level, same-origin popup-relay page. Because this app is embedded
        // in a cross-origin iframe, acquireTokenPopup opens this page (instead
        // of the IdP directly) and relays the interactive flow through it.
        popupRelayUri: "/relay",
    },
    cache: {
        cacheLocation: "localStorage",
    },
    system: {
        ...(EAR ? { protocolMode: "EAR" } : {}),
        loggerOptions: {
            logLevel: LogLevel.Info,
            loggerCallback: function (level, message, containsPii) {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    default:
                        console.debug(message);
                        return;
                }
            },
        },
    },
};

export const loginRequest = {
    scopes: ["User.Read"],
    extraQueryParameters: { dc: ESTS_TEST_SLICE },
    // POST submits the /authorize request as a POST form; GET (default) uses a
    // navigation. (EAR forces POST at the system level.)
    ...(HTTP_METHOD === "POST" ? { httpMethod: "POST" } : {}),
};
