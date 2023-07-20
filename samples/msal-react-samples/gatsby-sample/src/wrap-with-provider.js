import React from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./styles/theme";
import { CustomNavigationClient } from "./utils/NavigationClient";


export default ({element}) => {
    // createPublicClientApplication asynchronously instantiates and initializes the MSAL object
    PublicClientApplication.createPublicClientApplication(msalConfig).then((msalInstance) => {
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
    });
}
