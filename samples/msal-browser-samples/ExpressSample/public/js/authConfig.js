/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Function to create MSAL configuration - only called after environment validation
export function createMsalConfig() {
    return {
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
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
