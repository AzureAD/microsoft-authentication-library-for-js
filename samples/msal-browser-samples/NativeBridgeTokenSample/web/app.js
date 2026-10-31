"use strict";

const element = (name) => document.getElementById(name);
let application;
let authenticationResult;
let config;
let inspectedRequestId;

function clearBridgeRequest() {
    inspectedRequestId = undefined;
    element("bridge-request").textContent = "";
    element("bridge-request-region").hidden = true;
    element("bridge-response").textContent = "";
    element("bridge-response-region").hidden = true;
}

function inspectBridgeRequests(bridge) {
    bridge.addEventListener("message", (event) => {
        try {
            const message = event.data;
            if (typeof message !== "string" || !inspectedRequestId) return;
            const response = JSON.parse(message);
            if (response.messageType === "NestedAppAuthResponse" && response.requestId === inspectedRequestId) {
                element("bridge-response").textContent = message;
                element("bridge-response-region").hidden = false;
            }
        } catch {}
    });
    const original = bridge.postMessage;
    bridge.postMessage = function (...args) {
        try {
            const message = args[0];
            if (typeof message === "string") {
                const request = JSON.parse(message);
                if (request?.messageType === "NestedAppAuthRequest" &&
                    (request.method === "GetToken" || request.method === "GetTokenPopup")) {
                    clearBridgeRequest();
                    inspectedRequestId = request.requestId;
                    element("bridge-request").textContent = message;
                    element("bridge-request-region").hidden = false;
                }
            }
        } catch {}
        return Reflect.apply(original, this, args);
    };
}

function log(layer, event, fields = {}) {
    const entry = { timestamp: new Date().toISOString(), layer, event, ...fields };
    const output = element("events");
    output.textContent = (output.textContent + JSON.stringify(entry) + "\n").split("\n").slice(-200).join("\n");
    output.scrollTop = output.scrollHeight;
    console.debug("[poc]", entry);
}

window.addEventListener("bridge-debug", (event) => log("bridge", event.detail.event, {
    requestId: event.detail.requestId, method: event.detail.method, success: event.detail.success,
}));

function setBusy(busy) {
    element("interactive").disabled = busy || !application;
    element("silent").disabled = busy || !application;
    element("graph").disabled = busy || !authenticationResult;
}

function clearGraphResponse() {
    for (const field of ["name", "email", "job-title"]) element(`profile-${field}`).textContent = "";
    element("graph-raw").open = false;
    element("graph-response").textContent = "";
    element("graph-response-region").hidden = true;
}

async function acquire(interactive) {
    clearBridgeRequest();
    clearGraphResponse();
    authenticationResult = undefined;
    element("result").hidden = true;
    element("token").textContent = "Not acquired";
    element("expiry").textContent = "";
    element("correlation").textContent = "";
    element("graph-result").textContent = "Not called";
    setBusy(true);
    const correlationId = crypto.randomUUID();
    const started = performance.now();
    element("outcome").textContent = interactive ? "Acquiring through native executor..." : "Requesting silent native acquisition...";
    try {
        log("app", "acquire_start", { correlationId, interactive });
        const request = { scopes: config.scopes, authority: config.authority, correlationId };
        authenticationResult = interactive
            ? await application.acquireTokenPopup(request)
            : await application.acquireTokenSilent({ ...request, account: application.getAllAccounts()[0], forceRefresh: true });
        if (!authenticationResult.accessToken) throw new Error("empty_result");
        element("result").hidden = false;
        element("token").textContent = `Received (${authenticationResult.accessToken.length} characters; not displayed)`;
        element("expiry").textContent = authenticationResult.expiresOn?.toISOString() ?? "Unknown";
        element("correlation").textContent = authenticationResult.correlationId;
        element("outcome").textContent = "Token received through the native bridge.";
        log("app", "acquire_success", { correlationId, elapsedMs: Math.round(performance.now() - started), fromCache: authenticationResult.fromCache });
    } catch (error) {
        const code = error.errorCode ?? "acquire_failed";
        element("outcome").textContent = `Acquisition failed: ${code}`;
        log("app", "acquire_failed", { correlationId, code, elapsedMs: Math.round(performance.now() - started) });
    } finally {
        setBusy(false);
    }
}

async function callGraph() {
    clearGraphResponse();
    element("graph-result").textContent = "Not called";
    setBusy(true);
    const correlationId = crypto.randomUUID();
    try {
        log("graph", "request_start", { correlationId });
        const response = await fetch("https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName,jobTitle", {
            headers: { Authorization: `Bearer ${authenticationResult.accessToken}`, "client-request-id": correlationId },
            signal: AbortSignal.timeout(30000),
        });
        if (!response.ok) throw new Error("graph_failed");
        const profile = await response.json();
        if (!profile.id) throw new Error("graph_profile_missing");
        element("profile-name").textContent = profile.displayName ?? "Not provided";
        element("profile-email").textContent = profile.mail ?? profile.userPrincipalName ?? "Not provided";
        element("profile-job-title").textContent = profile.jobTitle ?? "Not provided";
        element("graph-response").textContent = JSON.stringify(profile, null, 2);
        element("graph-response-region").hidden = false;
        element("graph-result").textContent = `HTTP ${response.status}`;
        element("outcome").textContent = "Graph /me returned HTTP 200. The access token was accepted.";
        log("graph", "request_success", { correlationId, status: response.status });
    } catch {
        clearGraphResponse();
        element("graph-result").textContent = "Not called";
        element("outcome").textContent = "Graph verification failed. Check token expiry, permissions, and connectivity.";
        log("graph", "request_failed", { correlationId });
    } finally {
        setBusy(false);
    }
}

async function initialize() {
    try {
        config = window.bridgePocConfig;
        if (!config || !window.nestedAppAuthBridge || !window.msal) throw new Error("native_host_or_msal_missing");
        inspectBridgeRequests(window.nestedAppAuthBridge);
        element("app-name").textContent = config.appName ?? "Embedded App";
        document.title = `${config.appName ?? "Embedded App"} | Native Bridge POC`;
        element("client").textContent = config.clientId;
        element("authority").textContent = config.authority;
        element("scopes").textContent = config.scopes.join(" ");
        log("app", "initialize_start");
        let nestedSelected = false;
        application = await msal.createNestablePublicClientApplication({
            auth: { clientId: config.clientId, authority: config.authority },
            cache: { cacheLocation: "memoryStorage" },
        }, undefined, (configuration, controller) => {
            nestedSelected = true;
            return new msal.PublicClientApplication(configuration, controller);
        });
        if (!nestedSelected) {
            application = undefined;
            throw new Error("naa_factory_fell_back");
        }
        application.addEventCallback((event) => log("msal", event.eventType, { code: event.error?.errorCode }));
        element("status").textContent = "Native Bridge Connected";
        element("outcome").textContent = "Ready.";
        log("app", "initialize_success");
        setBusy(false);
        window.chrome?.webview?.postMessage(JSON.stringify({ messageType: "BridgePocReady" }));
    } catch (error) {
        element("status").textContent = "Unavailable";
        element("outcome").textContent = `Startup failed: ${error.message}`;
        log("app", "initialize_failed");
    }
}

element("interactive").addEventListener("click", () => acquire(true));
element("silent").addEventListener("click", () => acquire(false));
element("graph").addEventListener("click", callGraph);
element("clear-graph-response").addEventListener("click", () => {
    clearGraphResponse();
    element("graph").focus();
});
element("clear").addEventListener("click", () => { element("events").textContent = ""; });
element("clear-bridge-request").addEventListener("click", clearBridgeRequest);
window.addEventListener("pagehide", () => {
    clearBridgeRequest();
    clearGraphResponse();
});
initialize();