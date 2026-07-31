import { LogLevel } from "@azure/msal-browser";

const NESTED_APP_CLIENT_ID =
    import.meta.env.VITE_NESTED_APP_CLIENT_ID ||
    "00000000-0000-0000-0000-000000000002";
const TEST_TENANT_AUTHORITY =
    "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133";

/**
 * MSAL configuration for the nested (child) app.
 *
 * The nested app is created with `createNestablePublicClientApplication`, so it
 * acquires tokens through the host's `nestedAppAuthBridge` rather than talking
 * to the identity provider directly.
 */
export const msalConfig = {
    auth: {
        clientId: NESTED_APP_CLIENT_ID,
        authority: TEST_TENANT_AUTHORITY,
    },
    cache: {
        cacheLocation: "localStorage",
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(`Nested: ${message}`);
                        return;
                    case LogLevel.Warning:
                        console.warn(`Nested: ${message}`);
                        return;
                    default:
                        console.info(`Nested: ${message}`);
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
