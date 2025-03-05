/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthConfiguration } from "../../src/configuration/CustomAuthConfiguration.js";

export const customAuthConfig: CustomAuthConfiguration = {
    customAuth: {
        challengeTypes: ["password", "oob", "redirect"],
        authApiProxyUrl: "https://myspafunctiont1.azurewebsites.net/api/ReverseProxy/",
    },
    auth: {
        clientId: "d5e97fb9-24bb-418d-8e7a-4e1918303c92",
        authority: "https://spasamples.ciamlogin.com/",
        redirectUri: "/",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                return;
            },
        },
    },
};
