// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "14638111-3389-403d-b206-a6a71d9f8f16",
        authority: "https://login.microsoftonline.com/consumers"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
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
                }
            }
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages"
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ["Mail.Read", "openid", "profile"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const silentRequest = {
    scopes: ["ec242e59-0aa7-46e0-adf0-67f0879906f5/.default"],
    httpMethod: "POST",
    // prompt: "none",
    redirectUri: "https://copilot.microsoft.com",
    authorizePostBodyParameters: {
        "ssu": "1",
        "id_provider": "apple.com",
        "fidp_idtoken": process.env.TEST_FIDP_IDTOKEN
    },
    extraQueryParameters: {
        "msatestring": "1",
        // "dc": "ESTS-PUB-NCUS-LZ1-FD000-TEST3"
    }
};
