// Config object to be passed to Msal on creation
export const msalConfig = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_CLIENT_ID,
        authority: process.env.NEXT_PUBLIC_AUTHORITY,
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
    graphMeEndpoint: process.env.NEXT_PUBLIC_GRAPH_ENDPOINT
};
