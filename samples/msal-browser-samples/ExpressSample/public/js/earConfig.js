/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Separate EAR (Encrypted Authorize Response) flow configuration. Kept apart
// from the default sample config so the EAR test-app credentials and settings
// live in one place. These values are only applied when the sample is loaded
// with ?ear=true (see authConfig.js) and otherwise have no effect.
export const earConfig = {
    auth: {
        clientId: "9f33d0de-fdfd-431b-a565-af47c697a4c4",
        authority:
            "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133",
        redirectUri: "/redirect",
        postLogoutRedirectUri: "/redirect",
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
    system: {
        allowPlatformBroker: true,
    },
    request: {
        scopes: ["User.Read"],
    },
};

// Returns true when the current page was loaded with the ?ear=true query string.
export function isEarEnabled() {
    return new URLSearchParams(window.location.search).get("ear") === "true";
}
