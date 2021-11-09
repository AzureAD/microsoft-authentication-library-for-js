import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from '@material-ui/core/styles';
import { theme } from "./styles/theme";
import App from './App';

// MSAL imports
import { PublicClientApplication, EventType, EventMessage, AuthenticationResult } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import { AppInsightsProvider } from './AnalyticsProvider';

export const msalInstance = new PublicClientApplication(msalConfig);

// Account selection logic is app dependent. Adjust as needed for different use cases.
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event: EventMessage) => {
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        const account = payload.account;
        msalInstance.setActiveAccount(account);
    }
});



ReactDOM.render(
    <Router>
        <ThemeProvider theme={theme}>
            <AppInsightsProvider>
                <App pca={msalInstance} />
            </AppInsightsProvider>
        </ThemeProvider>
    </Router>,
    document.getElementById('root')
);
