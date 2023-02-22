// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID_HERE",
        authority: "ENTER_ADFS_AUTHORITY_HERE",
        knownAuthorities: ["ENTER_ADFS_DOMAIN_HERE"]
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
