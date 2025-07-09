/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const firefox = ua.indexOf("Firefox");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;
const isFirefox = firefox > 0; // Only needed if you need to support the redirect flow in Firefox incognito

// Configuration object to be passed to Msal on creation
// This configuration is injected from the server via window.msalConfig
window.msalConfig = {
    auth: {
        clientId: window.envConfig.CLIENT_ID,
        authority: window.envConfig.AUTHORITY,
        redirectUri: window.envConfig.REDIRECT_URI,
        postLogoutRedirectUri: window.envConfig.POST_LOGOUT_REDIRECT_URI,
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: isIE || isEdge || isFirefox,
    },
    system: {
        allowPlatformBroker: false, // Disables WAM Broker
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case msal.LogLevel.Error:
                        console.error(message);
                        return;
                    case msal.LogLevel.Info:
                        console.info(message);
                        return;
                    case msal.LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case msal.LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        return;
                }
            },
        },
    },
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
window.loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
window.graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
