import { Configuration, PopupRequest } from "@azure/msal-browser";

// Config object to be passed to Msal on creation
export const msalConfig: Configuration = {
    auth: {
        clientId: "0845a021-afdf-4126-abdd-099c5e6948e1",
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "/redirect",
        postLogoutRedirectUri: "/",
    },
    system: {
        allowPlatformBroker: false, // Disables WAM Broker
    },
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
export const loginRequest: PopupRequest = {
    scopes: ["User.Read"],
};

// Add here the endpoints for MS Graph API services you would like to use.
export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};
