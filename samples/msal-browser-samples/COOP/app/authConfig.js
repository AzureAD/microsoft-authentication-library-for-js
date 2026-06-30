// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "dd138a81-f5f8-4d9c-8d24-d7bdd6ecc58f",
        authority:
            "https://localhost:30663/c7cef333-42af-492c-afb0-21f74a661133",
        redirectUri: "https://localhost:30662/redirect",
        knownAuthorities: ["localhost:30663"],
        cloudDiscoveryMetadata: JSON.stringify({
            tenant_discovery_endpoint: "https://localhost:30663/c7cef333-42af-492c-afb0-21f74a661133/v2.0/.well-known/openid-configuration",
            metadata: [
                {
                    preferred_network: "localhost:30663",
                    preferred_cache: "localhost:30663",
                    aliases: ["localhost:30663", "login.microsoftonline.com"]
                }
            ]
        }),
        authorityMetadata: JSON.stringify({
            authorization_endpoint: "https://localhost:30663/c7cef333-42af-492c-afb0-21f74a661133/oauth2/v2.0/authorize",
            token_endpoint: "https://localhost:30663/c7cef333-42af-492c-afb0-21f74a661133/oauth2/v2.0/token",
            issuer: "https://localhost:30663/c7cef333-42af-492c-afb0-21f74a661133/v2.0",
            end_session_endpoint: "https://localhost:30663/c7cef333-42af-492c-afb0-21f74a661133/oauth2/v2.0/logout"
        }),
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            logLevel: msal.LogLevel.Trace,
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
                        console.log(message);
                        return;
                }
            },
        },
        pollIntervalMilliseconds: 0,
    },
    telemetry: {
        application: {
            appName: "MSAL Browser V2 Default Sample",
            appVersion: "1.0.0",
        },
    },
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"],
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages",
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ["Mail.Read"],
    forceRefresh: false, // Set this to "true" to skip a cached token and go to the server to get a new token
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read", "Mail.Read"],
};

const logoutRequest = {};
