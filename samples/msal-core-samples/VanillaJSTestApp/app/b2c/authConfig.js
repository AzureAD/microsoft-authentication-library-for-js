// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "e3b9ad76-9763-4827-b088-80c7a7888f79",
        authority: "https://login.microsoftonline.com/tfp/msidlabb2c.onmicrosoft.com/B2C_1_SISOPolicy/",
        knownAuthorities: ["login.microsoftonline.com"]
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["https://msidlabb2c.onmicrosoft.com/msidlabb2capi/read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};