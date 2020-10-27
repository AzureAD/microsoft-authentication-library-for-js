// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "4c837770-7a2b-471e-aafa-3328d04a23b1",
        authority: "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy/",
        knownAuthorities: ["login.microsoftonline.com"]
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const tokenRequest = {
    scopes: ["https://msidlabb2c.onmicrosoft.com/4c837770-7a2b-471e-aafa-3328d04a23b1/read "],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};