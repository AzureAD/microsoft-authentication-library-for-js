import { Configuration } from "@azure/msal-browser";

export const configuration: Configuration = {
    auth: {
        clientId: process.env.REACT_APP_MSAL_CLIENT_ID as string,
        authority: process.env.REACT_APP_MSAL_AUTHORITY,
    }
}