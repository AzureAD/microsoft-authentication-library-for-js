/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 *
 * Edit `clientId` and `authority` to point at your own app registration before
 * running the sample.
 */
const ESTS_TEST_SLICE = "ESTS-PUB-SCUS-FD000-TEST3-100";

const msalConfig = {
    auth: {
        clientId: "9f33d0de-fdfd-431b-a565-af47c697a4c4",
        authority:
            "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133",
        redirectUri: window.location.origin + "/",
    },
    system: {
        // Opt in: routes popup, logoutPopup, and ssoSilent through the legacy clients.
        enableLegacyPolling: true,
    },
};

const loginRequest = {
    scopes: ["User.Read"],
    extraQueryParameters: { dc: ESTS_TEST_SLICE },
};
