// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "e760cab2-b9a1-4c0d-86fb-ff7084abd902",
        authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi",
        knownAuthorities: ["fabrikamb2c.b2clogin.com"]
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
    scopes: ["https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const editProfileRequest = {
    scopes: ["openid"],
    authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_edit_profile",
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
}
