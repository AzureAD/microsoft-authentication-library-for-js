// Config object to be passed to Msal on creation
var msalConfig = {
    auth: {
        clientId: "4b0db8c2-9f26-4417-8bde-3f0e3656f8e0",
        redirectUri: "http://localhost:30662/"
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: true, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        telemetry: {
            applicationName: 'msalVanillaTestApp',
            applicationVersion: 'test1.0',
            telemetryEmitter: function(events) {
                console.log("Telemetry Events", events);
            }
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
var loginRequest = {
    scopes: ["openid", "profile"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

var tokenRequest = {
    scopes: ["User.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
}