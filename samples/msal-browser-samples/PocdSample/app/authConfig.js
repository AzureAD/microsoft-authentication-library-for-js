/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export const msalConfig = {
    auth: {
        // This existing MSAL test registration is not excluded from COOP.
        clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
        authority:
            "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133",
        redirectUri: window.location.origin + "/redirect",
        postLogoutRedirectUri: window.location.origin + "/redirect",
        originCheck: true,
    },
    cache: {
        cacheLocation: "localStorage",
    },
};

export const loginRequest = {
    scopes: ["User.Read"],
};
