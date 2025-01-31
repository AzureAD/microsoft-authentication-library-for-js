// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID_HERE",
        authority: "https://facebook.com",
        knownAuthorities: ["facebook.com"],
        protocolMode: msal.ProtocolMode.OIDC,
        OIDCOptions: { "serverResponseType": msal.ServerResponseType.QUERY, "defaultScopes": ["openid"] },
        authorityMetadata: '{ "issuer": "https://www.facebook.com", "authorization_endpoint": "https://facebook.com/dialog/oauth/", "token_endpoint": "https://graph.facebook.com/oauth/access_token", "jwks_uri": "https://www.facebook.com/.well-known/oauth/openid/jwks/" }',
        cache: {
            cacheLocation: "sessionStorage", // This configures where your cache will be stored
            storeAuthStateInCookie: false,
        },
        system: {
            allowPlatformBroker: false,
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
        },
        telemetry: {
            application: {
                appName: "MSAL Browser V2 Default Sample",
                appVersion: "1.0.0",
            },
        },
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ['openid']
};

// Add here the endpoints for FB Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.facebook.com/v17.0/me?fields=id,name,email" //you have to add the fields at the end of the url
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ['openid'],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const silentRequest = {
    scopes: ['openid']
};

const logoutRequest = {}