/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

import { showError, showSuccess } from "./utils.js";
import { updateUI } from "./ui.js";
import { createMsalConfig, loginRequest } from "./authConfig.js";

// Authentication module - handles all MSAL authentication logic

// MSAL instance
export let msalInstance;

// Retry state tracking
let retryRequested = false;

// Initialize MSAL
export async function initializeMsal() {
    try {
        // Create configuration at runtime
        const msalConfig = createMsalConfig();
        msalInstance = new msal.PublicClientApplication(msalConfig);
        await msalInstance.initialize();
        if (window.location.pathname !== "/playground") {
            await msalInstance.handleRedirectPromise().then((response) => {
                if (response) {
                    msalInstance.setActiveAccount(response.account);
                }
            });
        }
        updateUI(msalInstance.getActiveAccount());
    } catch (error) {
        console.error("MSAL initialization failed:", error);
        showError("Initialization failed: " + error.message);
    }
}

// Handle authentication for protected routes
export async function handleProtectedRouteAuth(path) {
    console.log(`Attempting authentication for protected route: ${path}`);

    // First attempt SSO silent
    return msalInstance
        .ssoSilent({
            scopes: loginRequest.scopes,
        })
        .then((response) => {
            msalInstance.setActiveAccount(response.account);
            updateUI(response.account);
        })
        .catch(async (error) => {
            console.error("SSO silent failed:", error);
            if (error instanceof msal.InteractionRequiredAuthError) {
                console.log("SSO silent failed - interaction required");
                await msalInstance.acquireTokenRedirect(loginRequest);
            } else {
                console.warn("SSO silent failed with unexpected error:", error);
            }
            showError("Authentication failed: " + error.message);
            return false;
        });
}

// Sign in with popup
export async function signInPopup() {
    // Show warning message when popup is about to open
    showPopupWarning();

    try {
        const response = await msalInstance.loginPopup({
            ...loginRequest,
            // Only override if user explicitly clicked retry
            overrideInteractionInProgress: retryRequested,
        });

        // Hide warning on success
        hidePopupWarning();
        retryRequested = false;

        msalInstance.setActiveAccount(response.account);
        updateUI(response.account);
        showSuccess("Successfully signed in!");
    } catch (error) {
        // Hide warning on error
        hidePopupWarning();

        if (error.errorCode === "interaction_in_progress") {
            // Show retry modal - let user decide whether to retry
            showRetryModal();
        } else {
            // Reset retry flag for other errors
            retryRequested = false;
            console.error("Popup sign in failed:", error);
            showError("Sign in failed: " + error.message);
        }
    }
}

// Sign in with redirect
export async function signInRedirect() {
    try {
        await msalInstance.loginRedirect(loginRequest);
    } catch (error) {
        console.error("Redirect sign in failed:", error);
        showError("Sign in failed: " + error.message);
    }
}

// Sign out with popup
export async function signOutPopup() {
    try {
        const logoutRequest = {
            account: msalInstance.getActiveAccount(),
        };

        await msalInstance.logoutPopup(logoutRequest);
        updateUI(null);
        showSuccess("Successfully signed out!");
    } catch (error) {
        console.error("Popup sign out failed:", error);
        showError("Sign out failed: " + error.message);
    }
}

// Sign out with redirect
export async function signOutRedirect() {
    try {
        const logoutRequest = {
            account: msalInstance.getActiveAccount(),
        };

        await msalInstance.logoutRedirect(logoutRequest);
    } catch (error) {
        console.error("Redirect sign out failed:", error);
        showError("Sign out failed: " + error.message);
    }
}

// Get access token silently
export async function getAccessToken() {
    return msalInstance
        .acquireTokenSilent({
            ...loginRequest,
        })
        .then((response) => {
            return response;
        })
        .catch(async (error) => {
            console.error("Silent token acquisition failed:", error);

            if (error instanceof msal.InteractionRequiredAuthError) {
                // Fallback to redirect
                await msalInstance.acquireTokenRedirect({
                    ...loginRequest,
                    account: msalInstance.getActiveAccount(),
                });
            }
            throw error;
        });
}

// Write the outcome of a silent call to #silentStatus. The e2e tests wait on the
// data-status attribute to synchronize on completion.
function setSilentStatus(status) {
    const el = document.getElementById('silentStatus');
    if (el) {
        el.dataset.status = status;
        el.textContent = status;
    }
}

// ssoSilent on the main instance (hidden-iframe silent auth). With EAR config
// this exercises the silent EAR authorize path.
export async function ssoSilent() {
    setSilentStatus('ssoSilent:pending');
    try {
        const account = msalInstance.getActiveAccount();
        const response = await msalInstance.ssoSilent({
            ...loginRequest,
            account,
            loginHint: account && account.username
        });
        msalInstance.setActiveAccount(response.account);
        setSilentStatus('ssoSilent:success');
        showSuccess('ssoSilent succeeded');
    } catch (error) {
        console.error('ssoSilent failed:', error);
        setSilentStatus('ssoSilent:error');
        showError('ssoSilent failed: ' + error.message);
    }
}

// acquireTokenSilent on the main instance. forceRefresh guarantees a network
// RT->AT exchange (/token) so the EAR-issued refresh token is actually used
// rather than returning a cached access token.
export async function acquireTokenSilent() {
    setSilentStatus('acquireTokenSilent:pending');
    try {
        const response = await msalInstance.acquireTokenSilent({
            ...loginRequest,
            account: msalInstance.getActiveAccount(),
            forceRefresh: true
        });
        msalInstance.setActiveAccount(response.account);
        setSilentStatus('acquireTokenSilent:success');
        showSuccess('acquireTokenSilent succeeded');
    } catch (error) {
        console.error('acquireTokenSilent failed:', error);
        setSilentStatus('acquireTokenSilent:error');
        showError('acquireTokenSilent failed: ' + error.message);
    }
}

/**
 * Show warning message during popup authentication
 */
function showPopupWarning() {
    const warningDiv = document.getElementById("popup-warning");
    if (warningDiv) {
        warningDiv.style.display = "block";
    }
}

/**
 * Hide warning message
 */
function hidePopupWarning() {
    const warningDiv = document.getElementById("popup-warning");
    if (warningDiv) {
        warningDiv.style.display = "none";
    }
}

/**
 * Show retry modal for interaction_in_progress error
 */
function showRetryModal() {
    const modal = document.getElementById("retry-modal");
    if (modal) {
        modal.style.display = "block";
    }
}

/**
 * Handle user clicking retry button
 */
export function handleRetry() {
    retryRequested = true; // User explicitly requested retry
    const modal = document.getElementById("retry-modal");
    if (modal) {
        modal.style.display = "none";
    }
    signInPopup();
}

/**
 * Handle user canceling retry
 */
export function handleCancelRetry() {
    retryRequested = false;
    const modal = document.getElementById("retry-modal");
    if (modal) {
        modal.style.display = "none";
    }
}
