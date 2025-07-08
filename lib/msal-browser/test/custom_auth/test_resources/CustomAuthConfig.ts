/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { LogLevel } from "@azure/msal-browser";
import { CustomAuthConfiguration } from "../../../src/custom_auth/configuration/CustomAuthConfiguration.js";

export const customAuthConfig: CustomAuthConfiguration = {
    customAuth: {
        challengeTypes: ["password", "oob", "redirect"],
        authApiProxyUrl:
            "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/",
    },
    auth: {
        clientId: "d5e97fb9-24bb-418d-8e7a-4e1918303c92",
        authority: "https://spasamples.ciamlogin.com/",
        redirectUri: "/",
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
                        console.info(`[Error] ${message}`);
                        return;
                    case LogLevel.Info:
                        console.info(`[Info] ${message}`);
                        return;
                    case LogLevel.Verbose:
                        console.info(`[Verbose] ${message}`);
                        return;
                    case LogLevel.Warning:
                        console.info(`[Warning] ${message}`);
                        return;
                    default:
                        return;
                }
            },
        },
    },
};
