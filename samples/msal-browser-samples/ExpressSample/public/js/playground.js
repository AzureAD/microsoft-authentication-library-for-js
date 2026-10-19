/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Playground module - handles MSAL API testing interface

import { createMsalConfig } from "./authConfig.js";
import { showError, showSuccess } from "./utils.js";

let playgroundMsalInstance = null;

export function initializePlayground() {
    // Load default configuration
    loadDefaultConfiguration();

    // Set up event listeners
    setupEventListeners();
}

function setupEventListeners() {
    // Configuration actions
    document
        .getElementById("resetConfig")
        ?.addEventListener("click", loadDefaultConfiguration);
    document
        .getElementById("applyConfig")
        ?.addEventListener("click", applyConfiguration);

    // API action buttons
    document
        .getElementById("btnAcquireTokenRedirect")
        ?.addEventListener("click", () =>
            handleApiCall("acquireTokenRedirect")
        );
    document
        .getElementById("btnAcquireTokenPopup")
        ?.addEventListener("click", () => handleApiCall("acquireTokenPopup"));
    document
        .getElementById("btnAcquireTokenSilent")
        ?.addEventListener("click", () => handleApiCall("acquireTokenSilent"));
    document
        .getElementById("btnSsoSilent")
        ?.addEventListener("click", () => handleApiCall("ssoSilent"));
    document
        .getElementById("btnGetAllAccounts")
        ?.addEventListener("click", () => handleApiCall("getAllAccounts"));
    document
        .getElementById("btnGetActiveAccount")
        ?.addEventListener("click", () => handleApiCall("getActiveAccount"));
    document
        .getElementById("btnLogoutRedirect")
        ?.addEventListener("click", () => handleApiCall("logoutRedirect"));
    document
        .getElementById("btnLogoutPopup")
        ?.addEventListener("click", () => handleApiCall("logoutPopup"));
    document
        .getElementById("btnLogoutPopupActiveAccount")
        ?.addEventListener("click", () =>
            handleApiCall("logoutPopupActiveAccount")
        );

    // Response actions
    document
        .getElementById("copyResponse")
        ?.addEventListener("click", copyResponse);
    document
        .getElementById("clearResponse")
        ?.addEventListener("click", clearResponse);
}

function loadDefaultConfiguration() {
    // Get the current configuration from the app
    const currentConfig = createMsalConfig();

    // Create a more detailed default config with helpful comments in the structure
    const defaultConfig = {
        auth: {
            clientId: currentConfig.auth.clientId || "YOUR_CLIENT_ID",
            authority:
                currentConfig.auth.authority ||
                "https://login.microsoftonline.com/common",
            redirectUri:
                currentConfig.auth.redirectUri || window.location.origin,
        },
        cache: {
            cacheLocation: "localStorage", // Options: "localStorage", "sessionStorage"
        },
        system: {},
    };

    // Create a comprehensive default token request
    const defaultRequest = {
        scopes: ["User.Read"],
        // Optional: Uncomment to add additional parameters
        // prompt: "select_account", // Options: "login", "select_account", "consent", "none"
        // loginHint: "user@example.com",
        // domainHint: "organizations", // Options: "consumers", "organizations", "common"
        // extraScopesToConsent: ["Mail.Read"],
        // state: "12345",
        // correlationId: "your-correlation-id"
    };

    const configElement = document.getElementById("msalConfig");
    const requestElement = document.getElementById("tokenRequest");

    if (configElement) {
        configElement.value = JSON.stringify(defaultConfig, null, 2);
    }

    if (requestElement) {
        requestElement.value = JSON.stringify(defaultRequest, null, 2);
    }

    // Don't automatically apply - let user review and click "Apply Configuration"
    // This gives them a chance to modify the config first
    showSuccess(
        'Default configuration loaded. Click "Apply Configuration" when ready.'
    );
}

async function applyConfiguration() {
    try {
        const configText = document.getElementById("msalConfig").value;
        const config = JSON.parse(configText);

        // Create new MSAL instance with the provided configuration
        playgroundMsalInstance = new msal.PublicClientApplication(config);

        // Initialize the MSAL instance
        await playgroundMsalInstance.initialize();

        // Handle redirect promise
        const redirectResponse =
            await playgroundMsalInstance.handleRedirectPromise();

        if (redirectResponse) {
            playgroundMsalInstance.setActiveAccount(redirectResponse.account);
            // Display the redirect response if we got one
            displayResponse(
                {
                    api: "acquireTokenRedirect",
                    success: true,
                    message: "Redirect response received",
                    response: redirectResponse,
                    timestamp: new Date().toISOString(),
                },
                "success"
            );
            showSuccess(
                "Configuration applied and redirect response received!"
            );
        } else {
            if (
                playgroundMsalInstance.getAllAccounts().length > 0 &&
                !playgroundMsalInstance.getActiveAccount()
            ) {
                playgroundMsalInstance.setActiveAccount(
                    playgroundMsalInstance.getAllAccounts()[0]
                );
            }
            showSuccess("Configuration applied successfully!");
            displayResponse(
                {
                    success: true,
                    message: "MSAL instance created and initialized",
                    timestamp: new Date().toISOString(),
                },
                "success"
            );
        }
    } catch (error) {
        showError("Invalid configuration: " + error.message);
        displayResponse(
            {
                error: "Configuration Error",
                message: error.message,
                details:
                    "Please check your JSON syntax and configuration values",
                timestamp: new Date().toISOString(),
            },
            "error"
        );
    }
}

async function handleApiCall(apiName) {
    if (!playgroundMsalInstance) {
        showError("Please apply a valid configuration first");
        return;
    }

    try {
        let result;
        const requestText = document.getElementById("tokenRequest").value;
        let request = requestText ? JSON.parse(requestText) : {};

        displayResponse(
            {
                status: "Executing...",
                api: apiName,
                timestamp: new Date().toISOString(),
            },
            "info"
        );

        switch (apiName) {
            case "acquireTokenRedirect":
                // This will redirect, so we show a message
                displayResponse(
                    {
                        status: "Redirecting...",
                        api: apiName,
                        request: request,
                        message: "Browser will redirect for authentication",
                        timestamp: new Date().toISOString(),
                    },
                    "info"
                );
                await playgroundMsalInstance.acquireTokenRedirect(request);
                break;

            case "acquireTokenPopup":
                result = await playgroundMsalInstance.acquireTokenPopup(
                    request
                );
                if (result.account) {
                    playgroundMsalInstance.setActiveAccount(result.account);
                }
                displayResponse(
                    {
                        api: apiName,
                        result: result,
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                showSuccess("Token acquired successfully via popup!");
                break;

            case "acquireTokenSilent":
                // Add account to request if available
                const accounts = playgroundMsalInstance.getAllAccounts();
                if (accounts.length === 0) {
                    throw new Error("No accounts found. Please sign in first.");
                }
                request.account = request.account || accounts[0];

                result = await playgroundMsalInstance.acquireTokenSilent(
                    request
                );
                displayResponse(
                    {
                        api: apiName,
                        result: result,
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                showSuccess("Token acquired silently!");
                break;

            case "ssoSilent":
                result = await playgroundMsalInstance.ssoSilent(request);
                displayResponse(
                    {
                        api: apiName,
                        result: result,
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                showSuccess("SSO silent authentication successful!");
                break;

            case "getAllAccounts":
                result = playgroundMsalInstance.getAllAccounts();
                displayResponse(
                    {
                        api: apiName,
                        result: result,
                        count: result.length,
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                showSuccess(`Found ${result.length} account(s)`);
                break;

            case "getActiveAccount":
                result = playgroundMsalInstance.getActiveAccount();
                displayResponse(
                    {
                        api: apiName,
                        result: result,
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                if (result) {
                    showSuccess("Active account retrieved");
                }
                break;

            case "logoutRedirect":
                displayResponse(
                    {
                        status: "Logging out...",
                        api: apiName,
                        message: "Browser will redirect for logout",
                        timestamp: new Date().toISOString(),
                    },
                    "info"
                );
                await playgroundMsalInstance.logoutRedirect();
                break;

            case "logoutPopup":
                await playgroundMsalInstance.logoutPopup();
                displayResponse(
                    {
                        api: apiName,
                        message: "Logged out successfully",
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                showSuccess("Logged out via popup!");
                break;

            case "logoutPopupActiveAccount":
                const activeAccount = playgroundMsalInstance.getActiveAccount();
                if (!activeAccount) {
                    throw new Error(
                        "No active account found. Please sign in first."
                    );
                }

                await playgroundMsalInstance.logoutPopup({
                    account: activeAccount,
                    postLogoutRedirectUri: `${window.location.origin}/redirect`,
                });
                displayResponse(
                    {
                        api: apiName,
                        message: "Logged out successfully",
                        timestamp: new Date().toISOString(),
                    },
                    "success"
                );
                showSuccess("Logged out via popup!");
                break;

            default:
                throw new Error(`Unknown API: ${apiName}`);
        }
    } catch (error) {
        showError(`${apiName} failed: ${error.message}`);
        displayResponse(
            {
                api: apiName,
                error: error.name || "Error",
                message: error.message,
                errorCode: error.errorCode,
                errorMessage: error.errorMessage,
                subError: error.subError,
                stack: error.stack,
                timestamp: new Date().toISOString(),
            },
            "error"
        );
    }
}

function displayResponse(data, type = "success") {
    const responseDisplay = document.getElementById("responseDisplay");

    // Create formatted JSON string
    const jsonString = JSON.stringify(data, null, 2);

    // Remove placeholder if it exists
    const placeholder = responseDisplay.querySelector(".response-placeholder");
    if (placeholder) {
        placeholder.remove();
    }

    // Check if responseContent already exists, update it instead of recreating
    let responseContent = document.getElementById("responseContent");
    if (!responseContent) {
        responseContent = document.createElement("div");
        responseContent.id = "responseContent";
        responseDisplay.appendChild(responseContent);
    }

    // Update the content and class
    responseContent.className = `response-content response-${type}`;
    responseContent.textContent = jsonString;
}

function copyResponse() {
    const responseDisplay = document.getElementById("responseDisplay");
    const content = responseDisplay.querySelector(".response-content");

    if (!content) {
        showError("No response to copy");
        return;
    }

    const text = content.textContent;

    navigator.clipboard
        .writeText(text)
        .then(() => {
            showSuccess("Response copied to clipboard!");
        })
        .catch((err) => {
            showError("Failed to copy response");
        });
}

function clearResponse() {
    const responseDisplay = document.getElementById("responseDisplay");
    responseDisplay.innerHTML = `
        <div class="response-placeholder">
            <span class="response-icon">💬</span>
            <p>API responses will appear here</p>
            <small>Click any action button above to see the result</small>
        </div>
    `;
}
