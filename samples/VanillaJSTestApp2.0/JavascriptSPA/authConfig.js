// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "Enter_the_Cloud_Instance_Id_HereEnter_the_Tenant_Info_Here",
        redirectUri: "Enter_the_Redirect_Uri_Here",
        tmp_clientSecret: "Enter_your_client_secret"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    }
};  

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["openid", "profile", "User.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMailEndpoint: "https://graph.microsoft.com/v1.0/me/messages"
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    scopes: ["Mail.Read"],
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};
