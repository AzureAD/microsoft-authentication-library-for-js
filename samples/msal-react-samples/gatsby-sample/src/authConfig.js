// Config object to be passed to Msal on creation
export const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID_HERE",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO_HERE",
        redirectUri: "/",
        postLogoutRedirectUri: "/"
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
};
