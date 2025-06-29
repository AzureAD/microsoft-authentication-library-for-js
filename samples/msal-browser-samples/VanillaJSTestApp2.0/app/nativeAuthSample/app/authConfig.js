/*
 * MSAL Native Auth Configuration
 */

// Access LogLevel from the global msalCustomAuth object
const { LogLevel } = msalCustomAuth;

import { Utilities } from './utilities.js';

// Define the msalConfig global variable
export const msalConfig = {
    customAuth: {
        challengeTypes: ["password", "oob", "redirect"],
        authApiProxyUrl: `http://localhost:30001/api`,
        // authApiProxyUrl: "https://func-proxy-u5g3xuaqeywxc.azurewebsites.net",
        // authApiProxyUrl: "https://login.ydtest.fun/cd97f2df-f1e9-4ee6-8dc0-d036accad626",
    },
    auth: {
        clientId: "bf51a508-ba84-4b15-b231-8b43ac362b40", // opt: 536ed3cf-8997-4de7-bd94-b53c9de872d0  pwd:bf51a508-ba84-4b15-b231-8b43ac362b40
        authority: "https://ciamtestlocal.ciamlogin.com",
        redirectUri: "/", // You must register this URI on Azure Portal/App Registration. Defaults to window.location.href e.g. http://localhost:3000/
        postLogoutRedirectUri: "",
        navigateToLoginRequestUrl: false,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        Utilities.logMessage(message, "error");
                        return;
                    case LogLevel.Info:
                        Utilities.logMessage(message, "info");
                        return;
                    case LogLevel.Verbose:
                        Utilities.logMessage(message, "info"); // Use info for verbose as we don't have a debug level
                        return;
                    case LogLevel.Warning:
                        Utilities.logMessage(message, "warning");
                        return;
                }
            },
        }
    }
};

