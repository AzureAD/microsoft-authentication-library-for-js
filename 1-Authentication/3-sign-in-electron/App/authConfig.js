/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { LogLevel } = require("@azure/msal-node");

const TENANT_SUBDOMAIN = 'Enter_the_Tenant_Subdomain_Here';

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const msalConfig = {
    auth: {
        clientId: 'Enter_the_Application_Id_Here',
        authority: `https://${TENANT_SUBDOMAIN}.ciamlogin.com/`, // Replace the placeholder with your tenant subdomain,
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        },
    },
};


module.exports = {
    msalConfig: msalConfig,
    TENANT_SUBDOMAIN,
};
