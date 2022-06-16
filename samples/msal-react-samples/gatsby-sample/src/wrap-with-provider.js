import React from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from "./styles/theme";
import { CustomNavigationClient } from "./utils/NavigationClient";

const msalInstance = new PublicClientApplication(msalConfig);

export default ({element}) => {
    // The next 2 lines are optional. This is how you configure MSAL to take advantage of the router's navigate functions when MSAL redirects between pages in your app
    const navigationClient = new CustomNavigationClient();
    msalInstance.setNavigationClient(navigationClient);

    return (
        <ThemeProvider theme={theme}>
            <MsalProvider instance={msalInstance}>
                {element}
            </MsalProvider>
        </ThemeProvider>
    );
}
