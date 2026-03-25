// demo usage of isPlatformBrokerAvailable API
const isPlatformBrokerAvailable = msal.isPlatformBrokerAvailable().then((isAvailable) => {
    console.log(`isNativeAvailable: ${isAvailable}`);
    return isAvailable;
}).catch((error) => {
    console.error("Error checking if platform broker is available:", error);
});

// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "57d46eaf-f643-4ef8-ba5f-ea27b2204321",
        //authority: "https://login.microsoftonline.com/f645ad92-e38d-4d1a-b510-d1b09a74a8ca"
        authority: "https://login.microsoftonline.com/common"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
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
                    case msal.LogLevel.Trace:
                        console.log(message);
                        return;
                }
            },
            logLevel: msal.LogLevel.Trace
        },
        allowPlatformBroker: true // For demonstration purposes, allowPlatformBroker is true by default as of MSAL Browser v3
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
    scopes: ["Mail.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read", "Mail.Read"]
};

const logoutRequest = {}
