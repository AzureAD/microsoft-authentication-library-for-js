import React from "react";
import ReactDOM from "react-dom/client";
import {
    createStandardPublicClientApplication,
    EventType,
} from "@azure/msal-browser";
import { msalConfig } from "./authConfig";
import App from "./App";

// The host initializes MSAL with the platform broker enabled and acts as the
// Nested App Authentication host for the embedded nested app.
createStandardPublicClientApplication(msalConfig).then((pca) => {
    if (!pca.getActiveAccount() && pca.getAllAccounts().length > 0) {
        pca.setActiveAccount(pca.getAllAccounts()[0]);
    }

    pca.addEventCallback((event) => {
        if (
            event.eventType === EventType.LOGIN_SUCCESS &&
            event.payload?.account
        ) {
            pca.setActiveAccount(event.payload.account);
        }
    });

    const container = document.getElementById("root");
    const root = ReactDOM.createRoot(container);
    root.render(<App pca={pca} />);
});
