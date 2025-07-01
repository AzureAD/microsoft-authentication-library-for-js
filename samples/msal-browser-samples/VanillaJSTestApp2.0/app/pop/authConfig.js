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
            logLevel: msal.LogLevel.Verbose,
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
                        console.trace(message);
                        return;
                }
            }
        }
    }
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};

const popConfig = {
    endpoint: "https://signedhttprequest.azurewebsites.net/api/validateSHR"
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"]
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read"],
};

const bearerTokenRequest = {
    scopes: ["openid", "profile", "User.Read"]
}

const popTokenRequest = {
    scopes: ["openid", "profile", "User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: popConfig.endpoint
}

const popTokenWithKidRequest = {
    scopes: ["openid", "profile", "User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    popKid: "XnsuAvttTPp0nn1K_YMLePLDbp7syCKhNHt7HjYHJYc",
};
