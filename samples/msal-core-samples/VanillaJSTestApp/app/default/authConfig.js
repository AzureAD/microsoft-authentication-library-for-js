// Config object to be passed to Msal on creation
const msalLogger = new Msal.Logger((level, message, pii) => {
    console.log(message);
}, {
    level: Msal.LogLevel.Verbose
})

const msalConfig = {
    auth: {
        clientId: "8fcb9fc1-d8f9-49c0-b80e-a8a8a201d051",
        redirectUri: "http://localhost:30662/",
        authority: "https://login.windows-ppe.net/common"
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
        },
        logger: msalLogger
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};
