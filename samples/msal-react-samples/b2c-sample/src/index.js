import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from '@mui/material/styles';
import { theme } from "./styles/theme";
import App from './App';

// MSAL imports
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

export const msalInstance = new PublicClientApplication(msalConfig);

msalInstance.initialize().then(() => {
  // Default to using the first account if no account is active on page load
  if (!msalInstance.getActiveAccount() && msalInstance.getAllAccounts().length > 0) {
    // Account selection logic is app dependent. Adjust as needed for different use cases.
    msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
  }

  // Optional - This will update account state if a user signs in from another tab or window
  msalInstance.enableAccountStorageEvents();

  msalInstance.addEventCallback((event) => {
    if (event.eventType === EventType.LOGIN_SUCCESS
      ||
      event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
      ||
      event.eventType === EventType.SSO_SILENT_SUCCESS
    ) {
      const account = event.payload.account;
      msalInstance.setActiveAccount(account);
    }
  });

  const container = document.getElementById("root");
  const root = ReactDOM.createRoot(container);

  root.render(
    <Router>
      <ThemeProvider theme={theme}>
        <App pca={msalInstance} />
      </ThemeProvider>
    </Router>
  );
});