/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "./authConfig.js";

const msalInstance = new PublicClientApplication(msalConfig);
const output = document.getElementById("output");
const signIn = document.getElementById("sign-in");
const signOut = document.getElementById("sign-out");
const nonInteractive = document.getElementById("prompt-none");
const httpMethod = document.getElementById("http-method");

// The E2E suite uses the same instance as the sample UI.
window.pca = msalInstance;

function showError(error) {
    console.error("MSAL operation failed:", error);
    output.textContent = `${error.errorCode || error.name}: ${error.message}`;
}

async function acquireToken(prompt) {
    try {
        const result = await msalInstance.acquireTokenPopup({
            ...loginRequest,
            httpMethod: httpMethod.value,
            ...(prompt ? { prompt } : {}),
        });
        msalInstance.setActiveAccount(result.account);
        signOut.disabled = false;
        output.textContent = JSON.stringify(
            {
                username: result.account.username,
                scopes: result.scopes,
                hasAccessToken: Boolean(result.accessToken),
                fromCache: result.fromCache,
            },
            null,
            2
        );
    } catch (error) {
        showError(error);
    }
}

signIn.addEventListener("click", () => acquireToken());
nonInteractive.addEventListener("click", () => acquireToken("none"));
signOut.addEventListener("click", async () => {
    try {
        await msalInstance.logoutPopup({
            account: msalInstance.getActiveAccount(),
        });
        signOut.disabled = true;
        output.textContent =
            "Signed out. The account and cached tokens were removed.";
    } catch (error) {
        showError(error);
    }
});

msalInstance.initialize().then(() => {
    signIn.disabled = false;
    nonInteractive.disabled = false;
    const account = msalInstance.getAllAccounts()[0];
    if (account) {
        msalInstance.setActiveAccount(account);
        signOut.disabled = false;
    }
    output.textContent =
        "Ready. MSAL computes pocd from the window's ancestors and opener.";
}, showError);
