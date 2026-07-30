// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
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

const dpopConfig = {
    // Replace with a DPoP-enabled test resource that validates the access token and proof.
    endpoint: "https://localhost:5001/api/validateDPoP"
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

const dpopTokenRequest = {
    scopes: ["openid", "profile", "User.Read"],
    authenticationScheme: msal.AuthenticationScheme.DPOP,
    resourceRequestMethod: "GET",
    resourceRequestUri: dpopConfig.endpoint
};
