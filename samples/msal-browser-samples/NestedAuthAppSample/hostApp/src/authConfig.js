import { LogLevel } from "@azure/msal-browser";

const HOST_APP_CLIENT_ID = import.meta.env.VITE_HOST_CLIENT_ID;

export const msalConfig = {
    auth: {
        clientId: HOST_APP_CLIENT_ID,
        authority: import.meta.env.VITE_AUTHORITY,
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
export const nestedAppProtocol =
    import.meta.env.VITE_NESTED_APP_PROTOCOL;
