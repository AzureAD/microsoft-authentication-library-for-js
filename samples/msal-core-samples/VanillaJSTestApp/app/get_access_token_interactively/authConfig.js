// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID_HERE",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID_HERE",
        redirectUri: "http://localhost:30662/",
        navigateToLoginRequestUrl: true,
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        telemetry: {
            applicationName: 'msalVanillaTestApp',
            applicationVersion: 'test1.0',
            telemetryEmitter: (events) => {
                console.log("Telemetry Events", events);
            }
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["openid", "profile", "User.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};
