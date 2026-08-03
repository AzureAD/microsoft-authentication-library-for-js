import { LogLevel } from "@azure/msal-browser";

const HOST_APP_CLIENT_ID =
    import.meta.env.VITE_HOST_APP_CLIENT_ID ||
    "00000000-0000-0000-0000-000000000001";
const TEST_TENANT_AUTHORITY =
    "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133";

/**
 * MSAL configuration for the host (top-frame) app.
 *
 * `system.allowPlatformBroker` enables brokering through the platform broker
 * (JS-WAM / Web Account Manager). The WAM-enabled browser environment provides
 * the `nestedAppAuthBridge` used by the embedded app.
 */
export const msalConfig = {
    auth: {
        clientId: HOST_APP_CLIENT_ID,
        authority: TEST_TENANT_AUTHORITY,
    },
    cache: {
        cacheLocation: "localStorage",
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

export const loginRequest = {
    scopes: ["User.Read"],
};

// Port the nested app is served on; injected by server.js.
export const nestedAppPort = import.meta.env.VITE_NESTED_APP_PORT || "30667";
