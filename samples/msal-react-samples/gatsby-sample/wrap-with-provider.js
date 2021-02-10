import React from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./src/authConfig";
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from "./src/styles/theme";
import { navigate } from "gatsby";

const msalInstance = new PublicClientApplication(msalConfig);

export default ({element}) => {
    // This config is optional. Use it if you want to take advantage of the router's client side navigation when msal redirects between pages in your app
    const config = {
        clientSideNavigate: async (path, search, hash) => {
            await navigate(path);
        }
    }
    return (
        <ThemeProvider theme={theme}>
            <MsalProvider instance={msalInstance} config={config}>
                {element}
            </MsalProvider>
        </ThemeProvider>
    );
}