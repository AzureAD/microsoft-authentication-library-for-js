import { LogLevel, ProtocolMode } from "@azure/msal-browser";

const HOST_APP_CLIENT_ID = import.meta.env.VITE_HOST_CLIENT_ID;

/**
 * Encrypted Authorize Response (EAR) is toggled per-page with `?ear=true`, so
 * the same host serves both the standard NAA flow and the NAA + EAR flow without
 * a second app. The e2e specs open the host with `?ear=true` to exercise EAR.
 */
export function isEarEnabled() {
    return new URLSearchParams(window.location.search).get("ear") === "true";
}

const earEnabled = isEarEnabled();
const queryParams = new URLSearchParams(window.location.search);
const kmsiEnabled = queryParams.get("kmsi") === "true";
const platformBrokerEnabled = queryParams.get("platformBroker") !== "false";

export const msalConfig = {
    auth: {
        clientId: HOST_APP_CLIENT_ID,
        authority: import.meta.env.VITE_AUTHORITY,
        // Derive the redirect URI from the running origin so it stays accurate
        // whether the host is served over http (`npm start`) or https
        // (`npm run start:https`).
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: kmsiEnabled ? "localStorage" : "sessionStorage",
    },
    system: {
        allowPlatformBroker: platformBrokerEnabled,
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

export const loginRequest = {
    scopes: ["User.Read"],
};

// Port the nested app is served on; injected by server.js.
export const nestedAppPort = import.meta.env.VITE_NESTED_APP_PORT;
export const nestedAppProtocol = import.meta.env.VITE_NESTED_APP_PROTOCOL;
