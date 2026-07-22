import { LogLevel } from "@azure/msal-browser";

// TODO: register a dedicated app for the nested (child) client and replace this
// client id. The nested app must be registered as an NAA client and be
// authorized by the host app. The authority points at the e2e test tenant.
const NESTED_APP_CLIENT_ID = "dd138a81-f5f8-4d9c-8d24-d7bdd6ecc58f";
const TEST_TENANT_AUTHORITY =
    "https://login.microsoftonline.com/c7cef333-42af-492c-afb0-21f74a661133";

/**
 * MSAL configuration for the nested (child) app.
 *
 * The nested app is created with `createNestablePublicClientApplication`, so it
 * acquires tokens through the host's `nestedAppAuthBridge` rather than talking
 * to the identity provider directly. `supportsNestedAppAuth` is set so the
 * client initializes in nested mode.
 */
export const msalConfig = {
    auth: {
        clientId: NESTED_APP_CLIENT_ID,
        authority: TEST_TENANT_AUTHORITY,
        supportsNestedAppAuth: true,
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
