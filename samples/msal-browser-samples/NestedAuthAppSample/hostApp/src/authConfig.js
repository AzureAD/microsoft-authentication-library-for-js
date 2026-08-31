import { LogLevel, ProtocolMode } from "@azure/msal-browser";

const HOST_APP_CLIENT_ID = import.meta.env.VITE_HOST_CLIENT_ID;

/**
 * Encrypted Authorize Response (EAR) is toggled per-page with `?ear=true`, so
 * the same host serves both the standard NAA flow and the NAA + EAR flow without
 * a second app. The e2e specs open the host with `?ear=true` to exercise EAR.
 *
 * EAR requires an EAR-enabled app registration. Point `VITE_EAR_HOST_CLIENT_ID`
 * / `VITE_EAR_AUTHORITY` at one for the EAR tests; when they are unset the
 * standard host registration is reused (which then must itself have EAR enabled).
 */
export function isEarEnabled() {
    return new URLSearchParams(window.location.search).get("ear") === "true";
}

const earEnabled = isEarEnabled();
const EAR_HOST_CLIENT_ID =
    import.meta.env.VITE_EAR_HOST_CLIENT_ID || HOST_APP_CLIENT_ID;
const EAR_AUTHORITY =
    import.meta.env.VITE_EAR_AUTHORITY || import.meta.env.VITE_AUTHORITY;

export const msalConfig = {
    auth: {
        clientId: earEnabled ? EAR_HOST_CLIENT_ID : HOST_APP_CLIENT_ID,
        authority: earEnabled ? EAR_AUTHORITY : import.meta.env.VITE_AUTHORITY,
        // Derive the redirect URI from the running origin so it stays accurate
        // whether the host is served over http (`npm start`) or https
        // (`npm run start:https`). The host is always served on port 30663, so
        // this resolves to `http(s)://localhost:30663`; register both schemes
        // (or just the one you run) as SPA redirect URIs on the host app.
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
    system: {
        allowPlatformBroker: true,
        // EAR switches the host to the encrypted-authorize-response protocol so
        // its own login AND the tokens it brokers for the nested app come back
        // as an encrypted `ear_jwe`. Only applied when the page opts in.
        ...(earEnabled ? { protocolMode: ProtocolMode.EAR } : {}),
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(`Host: ${message}`);
                        return;
                    case LogLevel.Warning:
                        console.warn(`Host: ${message}`);
                        return;
                    default:
                        console.info(`Host: ${message}`);
                        return;
                }
            },
            logLevel: LogLevel.Trace,
        },
    },
};

// ESTS test slice used for manual validation. Passed on BOTH the authorize
// request (extraQueryParameters) and the token request (extraParameters) so
// every ESTS call — authorize and token — is routed to the same slice.
const TEST_SLICE = { dc: "ESTS-PUB-SCUS-FD000-TEST3-100" };

export const loginRequest = {
    scopes: ["User.Read"],
    extraQueryParameters: { ...TEST_SLICE },
    extraParameters: { ...TEST_SLICE },
};

// Applied by the host when it brokers a nested-app token, so the brokered
// authorize AND token requests hit the same test slice as the host's own login.
export const brokerExtraParams = {
    extraQueryParameters: { ...TEST_SLICE },
    extraParameters: { ...TEST_SLICE },
};

// Port the nested app is served on; injected by server.js.
export const nestedAppPort = import.meta.env.VITE_NESTED_APP_PORT;
export const nestedAppProtocol = import.meta.env.VITE_NESTED_APP_PROTOCOL;
