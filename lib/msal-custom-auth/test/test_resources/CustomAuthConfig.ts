/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel } from "@azure/msal-browser";
import { CustomAuthConfiguration } from "../../src/configuration/CustomAuthConfiguration.js";

export const customAuthConfig: CustomAuthConfiguration = {
    customAuth: {
        challengeTypes: ["password", "oob", "redirect"],
        authApiProxyUrl: "https://spasampletestapp2.azurewebsites.net/api/HttpTrigger1/",
    },
    auth: {
        clientId: "d5e97fb9-24bb-418d-8e7a-4e1918303c92", // This is the ONLY mandatory field that you need to supply.
        authority: "https://spasamples.ciamlogin.com", // Replace the placeholder with your tenant subdomain
        redirectUri: "/", // Points to window.location.origin. You must register this URI on Azure Portal/App Registration.
        postLogoutRedirectUri: "/", // Indicates the page to navigate after logout.
        navigateToLoginRequestUrl: false, // If "true", will navigate back to the original request location before processing the auth code response.
    },
    cache: {
        cacheLocation: "sessionStorage", // Configures cache location. "sessionStorage" is more secure, but "localStorage" gives you SSO between tabs.
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
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
                    default:
                        return;
                }
            },
        },
    },
};
