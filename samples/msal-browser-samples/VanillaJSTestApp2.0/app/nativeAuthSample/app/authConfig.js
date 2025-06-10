/*
 * MSAL Native Auth Configuration
 */

// Access LogLevel from the global msalCustomAuth object
const { LogLevel } = msalCustomAuth;

// const tenantSubdomain = "ciamtestlocal";
// const tenantId = "cd97f2df-f1e9-4ee6-8dc0-d036accad626";

// Define the msalConfig global variable
export const msalConfig = {
    customAuth: {
        challengeTypes: ["password", "oob", "redirect"],
        authApiProxyUrl: `http://localhost:30001/api`,
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
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        console.info(message);
                        return;
                    case LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            },
        }
    }
};

