// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "b5c2e510-4a17-4feb-b219-e55aa5b74144",
        authority: "https://login.microsoftonline.com/common"
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
    scopes: ["User.Read"],
    extraQueryParameters: {
        "instance_aware": "true"
    }
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ["Mail.Read"],
    forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
    extraQueryParameters: {
        "instance_aware": "true"
    }
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read", "Mail.Read"],
    extraQueryParameters: {
        "instance_aware": "true"
    }
};

const logoutRequest = {}
