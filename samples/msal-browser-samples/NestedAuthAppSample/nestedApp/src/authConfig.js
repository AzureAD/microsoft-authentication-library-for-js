import { LogLevel } from "@azure/msal-browser";

const NESTED_APP_CLIENT_ID = import.meta.env.VITE_NESTED_CLIENT_ID;
const TEST_TENANT_AUTHORITY = import.meta.env.VITE_AUTHORITY;

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
        cacheLocation: "sessionStorage",
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

// The nested app requests tokens through the host bridge, so these extra params
// do not themselves reach ESTS (the host applies its own `brokerExtraParams` to
// the brokered request). They are declared here for symmetry with the host and
// to document the intended test slice on both the authorize and token requests.
export const loginRequest = {
    scopes: ["User.Read"],
    extraQueryParameters: { dc: "ESTS-PUB-SCUS-FD000-TEST3-100" },
    extraParameters: { dc: "ESTS-PUB-SCUS-FD000-TEST3-100" },
};
