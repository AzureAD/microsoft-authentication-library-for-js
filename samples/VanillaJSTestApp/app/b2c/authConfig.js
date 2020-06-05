// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "5dac5d6d-225c-4a98-a5e4-e29c82c0c4c9",
        authority: "https://public.msidlabb2c.com/tfp/cpimtestpartners.onmicrosoft.com/b2c_1_signupsignin_userflow",
        knownAuthorities: ["public.msidlabb2c.com"]
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
    scopes: ["openid", "profile"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const editProfileRequest = {
    scopes: ["openid"],
    authority: "https://public.msidlabb2c.com/tfp/cpimtestpartners.onmicrosoft.com/b2c_1_editprofile_userflow",
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
}
