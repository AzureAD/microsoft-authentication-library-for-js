/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { LogLevel } = require("@azure/msal-node");

const TENANT_NAME = 'Enter_the_Tenant_Name_Here';

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL.js configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const msalConfig = {
    auth: {
        clientId: 'Enter_the_Application_Id_Here',
        authority: `https://${TENANT_NAME}.ciamlogin.com/`, // replace "Enter_the_Tenant_Name_Here" with your tenant name,
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
    TENANT_NAME,
};
