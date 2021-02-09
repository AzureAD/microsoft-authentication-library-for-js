import React from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./src/authConfig";
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from "./src/styles/theme";
import { navigate } from "gatsby";

const msalInstance = new PublicClientApplication(msalConfig);

export default ({element}) => {
    const config = {
        clientSideNavigate: async (path, search, hash) => {
            await navigate(path);
            return true;
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