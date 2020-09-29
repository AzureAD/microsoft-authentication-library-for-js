import { PublicClientApplication } from "@azure/msal-browser";

export const msalInstance = new PublicClientApplication({
    auth: {
        clientId: "0a61c279-646b-4055-a5f1-1c3da7f70f18",
        redirectUri: "http://localhost:6006/"
    }
});