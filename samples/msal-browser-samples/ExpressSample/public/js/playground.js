/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the source repository root for complete license information.
 */

// Playground module - handles MSAL API testing interface

import { createMsalConfig } from "./authConfig.js";
import { showError, showSuccess } from "./utils.js";

let playgroundMsalInstance = null;
let lastDpopResult = null;

const DPOP_CLIENT_ID = "0845a021-afdf-4126-abdd-099c5e6948e1";
const DPOP_AUTHORITY = "https://login.microsoftonline.com/common";
const DPOP_BACKEND_URI = "https://localhost:45471/WeatherForecast/DPoP";
const DPOP_ESTS_DC = "ESTS-PUB-WUS3-FD000-TEST1-100";
const DPOP_SCENARIO = "dpop-nonce";
const DPOP_REDIRECT_PATH = "/dpop-nonce-redirect";
const DPOP_PENDING_REDIRECT_KEY = "msal.dpopNoncePlayground.pendingRedirect";
const DPOP_PENDING_REDIRECT_TTL_MS = 10 * 60 * 1000;
const DPOP_DIAGNOSTIC_LOG_KEY = "msal.dpopNoncePlayground.diagnostics";
const DPOP_HANDOFF_KEY_SUFFIX = ".dpop.nonce.redirect";

export function initializePlayground() {
    const pendingRedirect = getPendingRedirect();
    if (pendingRedirect) {
        populateConfiguration(pendingRedirect.config, pendingRedirect.request);
        appendDpopDiagnostic("redirect-final-page-loaded", {
            handoff: getDpopHandoffSnapshot(),
        });
        applyConfiguration();
    } else if (
        new URLSearchParams(window.location.search).get("scenario") ===
        DPOP_SCENARIO
    ) {
        loadDpopDefaults();
        applyConfiguration();
    } else {
        loadDefaultConfiguration();
    }

    // Set up event listeners
    setupEventListeners();
    renderDpopDiagnostics();
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
    document
        .getElementById("loadDpopDefaults")
        ?.addEventListener("click", loadDpopDefaults);
    document
        .getElementById("btnDpopCallOnce")
        ?.addEventListener("click", () => callDpopResource(false));
    document
        .getElementById("btnDpopChallengeRetry")
        ?.addEventListener("click", () => callDpopResource(true));
    document
        .getElementById("btnDpopLoadNonce")
        ?.addEventListener("click", loadMatchingDpopNonce);
    document
        .getElementById("btnDpopReplaceNonce")
        ?.addEventListener("click", replaceDpopNonce);
    document
        .getElementById("btnDpopMismatchNonce")
        ?.addEventListener("click", loadMismatchedDpopNonce);
    document
        .getElementById("btnDpopEviction")
        ?.addEventListener("click", testDpopNonceEviction);
    document.getElementById("btnDpopInspect")?.addEventListener("click", () => {
        appendDpopDiagnostic("handoff-inspected", {
            handoff: getDpopHandoffSnapshot(),
        });
    });
    document
        .getElementById("btnDpopClearCache")
        ?.addEventListener("click", clearDpopState);
    document
        .getElementById("btnDpopClearDiagnostics")
        ?.addEventListener("click", clearDpopDiagnostics);

    // Response actions
    document
        .getElementById("copyResponse")
        ?.addEventListener("click", copyResponse);
    document
        .getElementById("clearResponse")
        ?.addEventListener("click", clearResponse);
}

function populateConfiguration(config, request) {
    const configElement = document.getElementById("msalConfig");
    const requestElement = document.getElementById("tokenRequest");

    if (configElement) {
        configElement.value = JSON.stringify(config, null, 2);
    }

    if (requestElement) {
        requestElement.value = JSON.stringify(request, null, 2);
    }
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

    populateConfiguration(defaultConfig, defaultRequest);

    // Don't automatically apply - let user review and click "Apply Configuration"
    // This gives them a chance to modify the config first
    showSuccess(
        'Default configuration loaded. Click "Apply Configuration" when ready.'
    );
}

function loadDpopDefaults() {
    const config = {
        auth: {
            clientId: DPOP_CLIENT_ID,
            authority: DPOP_AUTHORITY,
            redirectUri: `${window.location.origin}${DPOP_REDIRECT_PATH}`,
        },
        cache: {
            cacheLocation: "localStorage",
        },
        system: {
            allowNativeBroker: false,
        },
    };
    const request = {
        scopes: ["User.Read"],
        authenticationScheme: "DPoP",
        resourceRequestMethod: "GET",
        resourceRequestUri: DPOP_BACKEND_URI,
        extraQueryParameters: {
            dc: DPOP_ESTS_DC,
        },
    };

    populateConfiguration(config, request);
    setDpopControlValue("dpopResourceUri", DPOP_BACKEND_URI);
    setDpopControlValue("dpopNonceOrigin", DPOP_BACKEND_URI);
    appendDpopDiagnostic("dpop-defaults-loaded", {
        resourceRequestUri: DPOP_BACKEND_URI,
        redirectUri: config.auth.redirectUri,
    });
    showSuccess(
        'DPoP nonce defaults loaded. Click "Apply Configuration" when ready.'
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
        registerDpopPerformanceTelemetry(playgroundMsalInstance);

        // Handle redirect promise
        const redirectResponse =
            await playgroundMsalInstance.handleRedirectPromise();

        if (redirectResponse) {
            playgroundMsalInstance.setActiveAccount(redirectResponse.account);
            await recordDpopResult("acquireTokenRedirect", redirectResponse);
            window.sessionStorage.removeItem(DPOP_PENDING_REDIRECT_KEY);
            appendDpopDiagnostic("redirect-completed", {
                handoff: getDpopHandoffSnapshot(),
            });
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
        renderDpopCapability();
        renderDpopDiagnostics();
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

    let dpopRedirectPending = false;
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
                request.redirectStartPage =
                    request.redirectStartPage ||
                    `${window.location.origin}/playground`;
                dpopRedirectPending = shouldUseDpopNonceRedirect(request);
                if (dpopRedirectPending) {
                    savePendingRedirect(request);
                    appendDpopDiagnostic("redirect-starting", {
                        resourceRequestUri: request.resourceRequestUri,
                        handoffBeforeAcquireTokenRedirect:
                            getDpopHandoffSnapshot(),
                    });
                }
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
                await recordDpopResult(apiName, result);
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
                await recordDpopResult(apiName, result);
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
        if (dpopRedirectPending) {
            window.sessionStorage.removeItem(DPOP_PENDING_REDIRECT_KEY);
            appendDpopDiagnostic("redirect-start-failed", {
                error: error.message,
            });
        }
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

function getPendingRedirect() {
    const serialized = window.sessionStorage.getItem(DPOP_PENDING_REDIRECT_KEY);
    if (!serialized) {
        return null;
    }

    try {
        const pending = JSON.parse(serialized);
        if (
            typeof pending.createdAt !== "number" ||
            Date.now() - pending.createdAt > DPOP_PENDING_REDIRECT_TTL_MS
        ) {
            window.sessionStorage.removeItem(DPOP_PENDING_REDIRECT_KEY);
            return null;
        }
        return pending;
    } catch {
        window.sessionStorage.removeItem(DPOP_PENDING_REDIRECT_KEY);
        return null;
    }
}

function savePendingRedirect(request) {
    const config = JSON.parse(document.getElementById("msalConfig").value);
    window.sessionStorage.setItem(
        DPOP_PENDING_REDIRECT_KEY,
        JSON.stringify({ config, request, createdAt: Date.now() })
    );
}

function shouldUseDpopNonceRedirect(request) {
    if (request.authenticationScheme !== "DPoP") {
        return false;
    }

    const config = JSON.parse(document.getElementById("msalConfig").value);
    return (
        new URL(config.auth.redirectUri, window.location.origin).pathname ===
        DPOP_REDIRECT_PATH
    );
}

function registerDpopPerformanceTelemetry(instance) {
    instance.addPerformanceCallback((events) => {
        events.forEach((event) => {
            const ext = event.ext || {};
            const failures = Object.fromEntries(
                Object.entries(ext).filter(([key]) =>
                    key.startsWith("dpopNonceRedirectHandoff")
                )
            );
            if (Object.keys(failures).length > 0) {
                appendDpopDiagnostic("handoff-storage-telemetry", {
                    event: event.name,
                    failures,
                });
            }
        });
    });
}

function renderDpopCapability() {
    const capabilityElement = document.getElementById("dpopCapabilityStatus");
    if (!capabilityElement) {
        return;
    }

    capabilityElement.textContent = playgroundMsalInstance
        ? msal.isDpopNonceProvider(playgroundMsalInstance)
            ? "Available: standard PCA exposes IDpopNonceProvider"
            : "Unavailable: this PCA does not expose IDpopNonceProvider"
        : "Apply a configuration to check capability support";
}

function setDpopControlValue(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.value = value;
    }
}

function getDpopControlValue(id) {
    return document.getElementById(id)?.value?.trim() || "";
}

function getDpopRequest() {
    const request = JSON.parse(
        document.getElementById("tokenRequest").value || "{}"
    );
    return {
        ...request,
        authenticationScheme: "DPoP",
        resourceRequestMethod:
            getDpopControlValue("dpopResourceMethod") ||
            request.resourceRequestMethod ||
            "GET",
        resourceRequestUri:
            getDpopControlValue("dpopResourceUri") ||
            request.resourceRequestUri ||
            DPOP_BACKEND_URI,
    };
}

async function acquireDpopResult(requestOverride) {
    if (!playgroundMsalInstance) {
        throw new Error("Apply a configuration first.");
    }

    const request = requestOverride || getDpopRequest();
    const accounts = playgroundMsalInstance.getAllAccounts();
    let result;

    if (accounts.length > 0) {
        result = await playgroundMsalInstance.acquireTokenSilent({
            ...request,
            account: playgroundMsalInstance.getActiveAccount() || accounts[0],
        });
    } else {
        result = await playgroundMsalInstance.acquireTokenPopup(request);
        if (result.account) {
            playgroundMsalInstance.setActiveAccount(result.account);
        }
    }

    await recordDpopResult("nonce-diagnostics", result);
    return result;
}

async function recordDpopResult(source, result) {
    if (!result?.dpopProof) {
        return;
    }

    lastDpopResult = result;
    const proof = await summarizeDpopProof(result.dpopProof);
    appendDpopDiagnostic("dpop-proof-acquired", {
        source,
        fromCache: result.fromCache,
        proof,
    });
}

async function summarizeDpopProof(proof) {
    const payload = decodeJwtPayload(proof);
    return {
        htm: payload.htm,
        htu: payload.htu,
        noncePresent: typeof payload.nonce === "string",
        nonceFingerprint:
            typeof payload.nonce === "string"
                ? await fingerprint(payload.nonce)
                : null,
        jti: payload.jti,
        iat: payload.iat,
    };
}

function decodeJwtPayload(jwt) {
    const payload = jwt.split(".")[1];
    if (!payload) {
        throw new Error("DPoP proof does not contain a payload.");
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        "="
    );
    return JSON.parse(atob(padded));
}

async function fingerprint(value) {
    const digest = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(value)
    );
    return Array.from(new Uint8Array(digest))
        .slice(0, 6)
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

async function loadNonce(resourceRequestUri, nonce, source) {
    if (
        !playgroundMsalInstance ||
        !msal.isDpopNonceProvider(playgroundMsalInstance)
    ) {
        throw new Error(
            "The configured PCA does not expose IDpopNonceProvider."
        );
    }

    await playgroundMsalInstance.loadDpopNonce(resourceRequestUri, nonce);
    appendDpopDiagnostic("nonce-loaded", {
        source,
        resourceRequestUri,
        nonceFingerprint: await fingerprint(nonce),
        nonceLength: new TextEncoder().encode(nonce).length,
    });
}

async function loadManualDpopNonce(source) {
    try {
        const resourceRequestUri =
            getDpopControlValue("dpopNonceOrigin") || DPOP_BACKEND_URI;
        const nonce =
            getDpopControlValue("dpopManualNonce") ||
            `manual-${crypto.randomUUID()}`;
        setDpopControlValue("dpopManualNonce", nonce);
        await loadNonce(resourceRequestUri, nonce, source);
        showSuccess("DPoP nonce loaded into PCA memory.");
    } catch (error) {
        showError("Unable to load DPoP nonce: " + error.message);
    }
}

async function loadMatchingDpopNonce() {
    setDpopControlValue(
        "dpopNonceOrigin",
        getDpopControlValue("dpopResourceUri") || DPOP_BACKEND_URI
    );
    await loadManualDpopNonce("manual");
}

async function replaceDpopNonce() {
    setDpopControlValue(
        "dpopNonceOrigin",
        getDpopControlValue("dpopResourceUri") || DPOP_BACKEND_URI
    );
    setDpopControlValue(
        "dpopManualNonce",
        `replacement-${crypto.randomUUID()}`
    );
    await loadManualDpopNonce("replacement");
}

async function loadMismatchedDpopNonce() {
    const resourceUri =
        getDpopControlValue("dpopResourceUri") || DPOP_BACKEND_URI;
    const resourceUrl = new URL(resourceUri);
    resourceUrl.hostname = `mismatch.${resourceUrl.hostname}`;
    setDpopControlValue("dpopNonceOrigin", resourceUrl.toString());
    setDpopControlValue("dpopManualNonce", `mismatch-${crypto.randomUUID()}`);
    await loadManualDpopNonce("mismatched-origin");
}

async function testDpopNonceEviction() {
    try {
        const firstResource = "https://eviction-0.example/resource";
        await loadNonce(
            firstResource,
            "eviction-sentinel",
            "eviction-sentinel"
        );
        for (let index = 1; index <= 50; index++) {
            await loadNonce(
                `https://eviction-${index}.example/resource`,
                `eviction-${index}`,
                "eviction-fill"
            );
        }

        const result = await acquireDpopResult({
            ...getDpopRequest(),
            resourceRequestUri: firstResource,
        });
        const proof = await summarizeDpopProof(result.dpopProof);
        appendDpopDiagnostic("nonce-capacity-tested", {
            firstResource,
            expectedEvicted: true,
            noncePresentInProof: proof.noncePresent,
        });
        showSuccess(
            proof.noncePresent
                ? "Capacity test failed: the oldest nonce was still present."
                : "Capacity test passed: the oldest of 51 origins was evicted."
        );
    } catch (error) {
        showError("Unable to test nonce capacity: " + error.message);
    }
}

async function callDpopResource(retryOnChallenge) {
    try {
        const request = getDpopRequest();
        const attempts = [];
        let result = await acquireDpopResult();
        let response = await sendDpopRequest(request, result);
        attempts.push(await summarizeDpopAttempt(result, response));

        const responseNonce = response.headers.get("DPoP-Nonce");
        if (retryOnChallenge && responseNonce) {
            await loadNonce(
                response.url,
                responseNonce,
                response.ok
                    ? "resource-response-rotation"
                    : "resource-challenge"
            );
            if (!response.ok) {
                result = await acquireDpopResult();
                response = await sendDpopRequest(request, result);
                attempts.push(await summarizeDpopAttempt(result, response));

                const rotatedNonce = response.headers.get("DPoP-Nonce");
                if (rotatedNonce) {
                    await loadNonce(
                        response.url,
                        rotatedNonce,
                        response.ok
                            ? "resource-response-rotation"
                            : "resource-challenge-after-retry"
                    );
                }
            }
        }

        displayResponse(
            {
                api: retryOnChallenge
                    ? "callDpopResourceWithNonceRetry"
                    : "callDpopResourceOnce",
                attempts,
                handoff: getDpopHandoffSnapshot(),
                timestamp: new Date().toISOString(),
            },
            response.ok ? "success" : "error"
        );
    } catch (error) {
        showError("DPoP resource call failed: " + error.message);
        displayResponse(
            {
                api: "callDpopResource",
                error: error.name || "Error",
                message: error.message,
                timestamp: new Date().toISOString(),
            },
            "error"
        );
    }
}

async function sendDpopRequest(request, result) {
    if (!result?.accessToken || !result?.dpopProof) {
        throw new Error("Token acquisition did not return a DPoP proof.");
    }

    return fetch(request.resourceRequestUri, {
        method: request.resourceRequestMethod,
        headers: {
            Authorization: `DPoP ${result.accessToken}`,
            DPoP: result.dpopProof,
        },
    });
}

async function summarizeDpopAttempt(result, response) {
    const nonce = response.headers.get("DPoP-Nonce");
    const responseText = await response.text();
    return {
        status: response.status,
        ok: response.ok,
        responseUrl: response.url,
        responseNoncePresent: Boolean(nonce),
        responseNonceFingerprint: nonce ? await fingerprint(nonce) : null,
        proof: await summarizeDpopProof(result.dpopProof),
        responseBody: responseText.slice(0, 2000),
    };
}

async function clearDpopState() {
    try {
        if (!playgroundMsalInstance) {
            throw new Error("Apply a configuration first.");
        }
        await playgroundMsalInstance.clearCache();
        lastDpopResult = null;
        appendDpopDiagnostic("pca-cache-cleared", {
            handoff: getDpopHandoffSnapshot(),
        });
        showSuccess("PCA cache and in-memory nonce state cleared.");
    } catch (error) {
        showError("Unable to clear PCA state: " + error.message);
    }
}

function getDpopHandoffSnapshot() {
    const entries = [];
    for (let index = 0; index < window.sessionStorage.length; index++) {
        const key = window.sessionStorage.key(index);
        if (!key?.endsWith(DPOP_HANDOFF_KEY_SUFFIX)) {
            continue;
        }

        const serialized = window.sessionStorage.getItem(key);
        let parsed = null;
        try {
            parsed = serialized ? JSON.parse(serialized) : null;
        } catch {
            parsed = null;
        }
        entries.push({
            key,
            resourceServer: parsed?.resourceServer,
            expiresAt: parsed?.expiresAt,
            nonceLength:
                typeof parsed?.nonce === "string"
                    ? new TextEncoder().encode(parsed.nonce).length
                    : null,
            stateBound: typeof parsed?.state === "string",
            correlationIdBound: typeof parsed?.correlationId === "string",
        });
    }
    return entries;
}

function appendDpopDiagnostic(type, details = {}) {
    const diagnostics = readDpopDiagnostics();
    diagnostics.push({
        timestamp: new Date().toISOString(),
        type,
        ...details,
    });
    window.sessionStorage.setItem(
        DPOP_DIAGNOSTIC_LOG_KEY,
        JSON.stringify(diagnostics.slice(-100))
    );
    renderDpopDiagnostics();
}

function readDpopDiagnostics() {
    try {
        return JSON.parse(
            window.sessionStorage.getItem(DPOP_DIAGNOSTIC_LOG_KEY) || "[]"
        );
    } catch {
        return [];
    }
}

function renderDpopDiagnostics() {
    const diagnosticsElement = document.getElementById("dpopDiagnostics");
    if (!diagnosticsElement) {
        return;
    }
    diagnosticsElement.textContent = JSON.stringify(
        {
            capability:
                playgroundMsalInstance &&
                msal.isDpopNonceProvider(playgroundMsalInstance),
            lastProof: lastDpopResult?.dpopProof
                ? "Available in memory"
                : "None",
            handoff: getDpopHandoffSnapshot(),
            events: readDpopDiagnostics(),
        },
        null,
        2
    );
}

function clearDpopDiagnostics() {
    window.sessionStorage.removeItem(DPOP_DIAGNOSTIC_LOG_KEY);
    renderDpopDiagnostics();
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
