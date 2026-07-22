import { LogLevel } from "@azure/msal-browser";

// TODO: register a dedicated host app and replace this client id. The host app
// must be registered as an NAA host authorized to broker for the nested client.
const HOST_APP_CLIENT_ID = "dd138a81-f5f8-4d9c-8d24-d7bdd6ecc58f";
const TEST_TENANT_AUTHORITY =
    "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133";

/**
 * MSAL configuration for the host (top-frame) app.
 *
 * `system.allowPlatformBroker` enables brokering through the platform broker
 * (JS-WAM / Web Account Manager). `auth.supportsNestedAppAuth` advertises the
 * host as a Nested App Authentication host so the embedded nested app can
 * acquire tokens through it. The platform broker provides the actual
 * `nestedAppAuthBridge` in the WAM-enabled environment.
 */
export const msalConfig = {
    auth: {
        clientId: HOST_APP_CLIENT_ID,
        authority: TEST_TENANT_AUTHORITY,
        supportsNestedAppAuth: true,
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
