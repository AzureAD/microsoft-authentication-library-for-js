import React from "react";
import ReactDOM from "react-dom/client";
import { createNestablePublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import { installNestedAppAuthBridge } from "./nestedAppAuthBridge";
import App from "./App";

// Install `window.nestedAppAuthBridge` BEFORE creating the nestable client so
// MSAL detects the bridge and brokers tokens through the host instead of
// contacting the identity provider directly.
installNestedAppAuthBridge();

// The nested app creates a *nestable* client. It communicates with the host's
// `window.nestedAppAuthBridge` instead of contacting the identity provider
// directly; the host relays requests over the web flow (or the platform broker
// when one is available).
createNestablePublicClientApplication(msalConfig).then((pca) => {
    if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
        pca.setActiveAccount(pca.getAllAccounts()[0]);
    }

    const container = document.getElementById("root");
    const root = ReactDOM.createRoot(container);
    root.render(<App pca={pca} />);
});
