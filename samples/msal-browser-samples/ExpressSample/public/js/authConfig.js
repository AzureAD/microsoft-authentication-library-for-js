/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

import {
    isEarEnabled,
    isPlatformBrokerEnabled,
    platformBrokerConfig,
} from './earConfig.js';

// Function to create MSAL configuration - only called after environment validation
export function createMsalConfig() {
    const msalConfig = {
        auth: {
            clientId: window.envConfig.CLIENT_ID,
            authority: window.envConfig.AUTHORITY,
            redirectUri: window.envConfig.REDIRECT_URI,
            postLogoutRedirectUri: window.envConfig.POST_LOGOUT_REDIRECT_URI,
        },
        cache: {
            cacheLocation: window.envConfig.CACHE_LOCATION || "localStorage"
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
        }
    };

    const earEnabled = isEarEnabled();
    const kmsiTestEnabled =
        new URLSearchParams(window.location.search).get("kmsi") === "true";
    if (kmsiTestEnabled) {
        msalConfig.cache.cacheLocation = "sessionStorage";
    }

    if (earEnabled || isPlatformBrokerEnabled()) {
        msalConfig.auth.clientId = platformBrokerConfig.auth.clientId;
        msalConfig.auth.authority = platformBrokerConfig.auth.authority;
        msalConfig.auth.redirectUri = platformBrokerConfig.auth.redirectUri;
        msalConfig.auth.postLogoutRedirectUri =
            platformBrokerConfig.auth.postLogoutRedirectUri;
        msalConfig.cache.cacheLocation = platformBrokerConfig.cache.cacheLocation;
        msalConfig.system.allowPlatformBroker =
            platformBrokerConfig.system.allowPlatformBroker;
    }

    // ?ear=true additionally forces the encrypted-response protocol.
    if (earEnabled) {
        msalConfig.system.protocolMode = msal.ProtocolMode.EAR;
    }

    return msalConfig;
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
