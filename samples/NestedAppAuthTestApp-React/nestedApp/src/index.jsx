import React from "react";
import ReactDOM from "react-dom/client";
import { createNestablePublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import App from "./App";

// The nested app creates a *nestable* client. It communicates with the host's
// `window.nestedAppAuthBridge` instead of contacting the identity provider
// directly; the host relays requests to the platform broker.
createNestablePublicClientApplication(msalConfig).then((pca) => {
    if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
        pca.setActiveAccount(pca.getAllAccounts()[0]);
    }

    const container = document.getElementById("root");
    const root = ReactDOM.createRoot(container);
    root.render(<App pca={pca} />);
});
