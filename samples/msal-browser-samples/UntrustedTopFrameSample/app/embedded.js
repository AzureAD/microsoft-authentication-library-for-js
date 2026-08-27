/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Embedded iframe app (trusted origin), running inside an untrusted cross-origin
 * host. It owns a real MSAL PublicClientApplication configured with a
 * `popupRelayUri`. Because interactive auth cannot complete inside a
 * partitioned cross-site iframe (IdP X-Frame-Options + COOP + partitioned
 * BroadcastChannel), MSAL relays the interactive step through a top-level popup
 * on this same origin (the relay page). All of that is now handled inside
 * acquireTokenPopup — this app just calls it like any other SPA. No PKCE, no
 * manual popup, no postMessage relay here.
 */
import {
    PublicClientApplication,
    InteractionRequiredAuthError,
} from "@azure/msal-browser";
import { msalConfig, loginRequest, HTTP_METHOD } from "./authConfig.js";

(function () {
    "use strict";

    const msalInstance = new PublicClientApplication(msalConfig);
    let currentAccount = null;

    // Exposed for E2E tests to drive MSAL APIs directly.
    window.pca = msalInstance;
    // Exposed for debugging which /authorize method the iframe is configured for.
    window.__httpMethod = HTTP_METHOD;

    // ---- UI references ----
    const notAuthDiv = document.getElementById("not-authenticated");
    const authDiv = document.getElementById("authenticated");
    const usernameDisplay = document.getElementById("username-display");
    const tokenInfo = document.getElementById("token-info");
    const tokenResponse = document.getElementById("token-response");
    const statusText = document.getElementById("status-text");

    // Surface the active method so it's obvious which request shape is exercised.
    statusText.textContent = `Not signed in. (httpMethod: ${HTTP_METHOD})`;

    function showAuthenticatedUI(account) {
        currentAccount = account;
        usernameDisplay.textContent = account.username || account.name || "";
        notAuthDiv.style.display = "none";
        authDiv.style.display = "";
    }

    function showTokenResponse(result) {
        tokenInfo.style.display = "";
        tokenResponse.textContent = JSON.stringify(
            {
                account: result.account && result.account.username,
                scopes: result.scopes,
                expiresOn: result.expiresOn,
                fromCache: result.fromCache,
            },
            null,
            2
        );
    }

    // ---- Initialize MSAL and restore any existing session ----
    msalInstance
        .initialize()
        .then(function () {
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                msalInstance.setActiveAccount(accounts[0]);
                showAuthenticatedUI(accounts[0]);
            }
        })
        .catch(function (error) {
            console.error("MSAL initialization failed:", error);
        });

    // ---- Sign in (interactive). acquireTokenPopup relays through the
    //      popupRelayUri page automatically because the app is embedded. ----
    document.getElementById("signIn").addEventListener("click", function () {
        statusText.textContent = "Opening secure sign-in popup...";
        msalInstance
            .acquireTokenPopup(loginRequest)
            .then(function (result) {
                const account = result.account || currentAccount;
                msalInstance.setActiveAccount(account);
                showAuthenticatedUI(account);
                statusText.textContent = "Signed in successfully.";
            })
            .catch(function (error) {
                console.error("Sign-in failed:", error);
                statusText.textContent =
                    error && error.message
                        ? error.message
                        : "Sign-in failed. See console.";
            });
    });

    // ---- Acquire token: silent first, popup only if interaction is required ----
    document
        .getElementById("acquireTokenSilent")
        .addEventListener("click", function () {
            const request = {
                scopes: loginRequest.scopes,
                account: currentAccount,
            };
            msalInstance
                .acquireTokenSilent(request)
                .then(showTokenResponse)
                .catch(function (error) {
                    if (error instanceof InteractionRequiredAuthError) {
                        msalInstance
                            .acquireTokenPopup({
                                scopes: loginRequest.scopes,
                                account: currentAccount,
                            })
                            .then(function (result) {
                                currentAccount =
                                    result.account || currentAccount;
                                showTokenResponse(result);
                            })
                            .catch(function (popupError) {
                                console.error(
                                    "Interactive token acquisition failed:",
                                    popupError
                                );
                            });
                    } else {
                        console.error("Silent token failed:", error);
                    }
                });
        });

    // ---- Sign out: full IdP logout, relayed through the popup-relay page.
    //      logoutPopup clears the local cache AND ends the IdP session; because
    //      popupRelayUri is set, the end-session navigation is brokered through
    //      the top-level relay page just like sign-in. ----
    document.getElementById("signOut").addEventListener("click", function () {
        statusText.textContent = "Opening secure sign-out popup...";
        msalInstance
            .logoutPopup({ account: currentAccount })
            .then(function () {
                currentAccount = null;
                authDiv.style.display = "none";
                notAuthDiv.style.display = "";
                statusText.textContent = "Signed out.";
            })
            .catch(function (error) {
                console.error("Sign out failed:", error);
                statusText.textContent =
                    error && error.message
                        ? error.message
                        : "Sign-out failed. See console.";
            });
    });
})();
