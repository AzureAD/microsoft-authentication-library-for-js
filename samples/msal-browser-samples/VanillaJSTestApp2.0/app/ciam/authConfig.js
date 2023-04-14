// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "b5c2e510-4a17-4feb-b219-e55aa5b74144",
        authority: "https://msidlabciam1.ciamlogin.com/msidlabciam1.onmicrosoft.com"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            logLevel: msal.LogLevel.Trace,
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case msal.LogLevel.Error:
                        console.error(message);
                        return;
                    case msal.LogLevel.Info:
                        console.info(message);
                        return;
                    case msal.LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case msal.LogLevel.Warning:
                        console.warn(message);
                        return;
                    default:
                        console.log(message);
                        return;
                }
            }
        }
    },
    telemetry: {
        application: {
            appName: "MSAL Browser V2 Default Sample",
            appVersion: "1.0.0"
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: [],
    extraQueryParameters: { dc: "ESTS-PUB-EUS-AZ1-FD000-TEST1" }
};

const logoutRequest = {}
