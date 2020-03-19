// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "6226576d-37e9-49eb-b201-ec1eeb0029b6",
        redirectUri: "http://localhost:30662/"
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
