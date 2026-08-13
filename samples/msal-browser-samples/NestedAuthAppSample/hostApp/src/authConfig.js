import { LogLevel } from "@azure/msal-browser";

const HOST_APP_CLIENT_ID = import.meta.env.VITE_HOST_CLIENT_ID;

export const msalConfig = {
    auth: {
        clientId: HOST_APP_CLIENT_ID,
        authority: import.meta.env.VITE_AUTHORITY,
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
export const nestedAppPort = import.meta.env.VITE_NESTED_APP_PORT;
export const nestedAppProtocol =
    import.meta.env.VITE_NESTED_APP_PROTOCOL;
