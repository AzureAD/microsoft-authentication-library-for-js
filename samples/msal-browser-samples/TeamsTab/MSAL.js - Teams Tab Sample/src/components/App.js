// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import React from 'react';
import './App.css';
import * as microsoftTeams from "@microsoft/teams-js";
import { BrowserRouter as Router, Route } from "react-router-dom";

import Privacy from "./Privacy";
import TermsOfUse from "./TermsOfUse";
import Tab from "./Tab";
import ConsentPopup from "./ConsentPopup";
import ClosePopup from "./ClosePopup";
import TabConfig from "./TabConfig";

import { MsalProvider } from "@azure/msal-react";
import { BrowserCacheLocation, PublicClientApplication } from "@azure/msal-browser";

let client_id = process.env.REACT_APP_AZURE_APP_REGISTRATION_ID; //Client ID of the Azure AD app registration ( may be from different tenant for multitenant apps)

const msal = new PublicClientApplication({
    auth: {
        clientId: client_id,
        authority: `https://login.microsoftonline.com/common`,
        redirectUri: window.location.origin + "/auth-end",
        navigateToLoginRequestUrl: false // Set to false to prevent looping in auth popup
    },
    cache: {
        cacheLocation: BrowserCacheLocation.LocalStorage // Ensure cache is shared between windows/tabs
    }
})

/**
 * The main app which handles the initialization and routing
 * of the app.
 */
function App() {

  // Initialize the Microsoft Teams SDK
  microsoftTeams.initialize();

  // Display the app home page hosted in Teams
  return (
      <MsalProvider instance={msal}>
        <Router>
        <Route exact path="/privacy" component={Privacy} />
        <Route exact path="/termsofuse" component={TermsOfUse} />
        <Route exact path="/tab" component={Tab} />
        <Route exact path="/config" component={TabConfig}/>
        <Route exact path="/auth-start" component={ConsentPopup} />
        <Route exact path="/auth-end" component={ClosePopup} />
        </Router>
      </MsalProvider>
  );
}

export default App;
