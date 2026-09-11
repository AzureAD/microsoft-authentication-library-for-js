/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Broker-enabled test configuration shared by the standalone platform-broker
// and EAR modes. The app registration is enabled for both scenarios.
export const platformBrokerConfig = {
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

// True when the page was loaded with ?ear=true.
export function isEarEnabled() {
    return new URLSearchParams(window.location.search).get("ear") === "true";
}

// True when the page was loaded with ?platformBroker=true.
export function isPlatformBrokerEnabled() {
    return (
        new URLSearchParams(window.location.search).get("platformBroker") ===
        "true"
    );
}
