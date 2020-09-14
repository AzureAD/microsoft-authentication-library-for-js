// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "57448aa1-9515-4176-a106-5cb9be8550e1",
        authority: "https://fs.msidlab8.com/adfs/",
        knownAuthorities: ["fs.msidlab8.com"]
    },
    cache: {
        cacheLocation: "localStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["openid", "profile"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};
