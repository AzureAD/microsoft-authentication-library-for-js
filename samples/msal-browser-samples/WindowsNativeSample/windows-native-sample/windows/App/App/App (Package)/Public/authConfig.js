// Config object to be passed to Msal on creation

const msalConfig = {
    auth: {
        clientId: "Enter_the_Application_Id_Here",
        authority: "Enter_the_Cloud_Instance_Id_Here/common",
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
            appName: "MSAL Browser V2 Windows Sample",
            appVersion: "1.0.0"
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["User.Read"]
};

// Add here the endpoints for MS Graph API services you would like to use.
const graphConfig = {
    graphMeEndpoint: "Enter_the_Graph_Endpoint_Here"
};

// Add here scopes for access token to be used at MS Graph API endpoints.
const tokenRequest = {
    forceRefresh: false // Set this to "true" to skip a cached token and go to the server to get a new token
};

const silentRequest = {
    scopes: ["openid", "profile", "User.Read"]
};

const logoutRequest = {}
