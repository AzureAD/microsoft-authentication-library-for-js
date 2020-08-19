/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
module.exports =  {
    auth: {
        clientId: "89e61572-2f96-47ba-b571-9d8c8f96b69d",
        authority: "https://login.microsoftonline.com/5d97b14d-c396-4aee-b524-c86d33e9b660",
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};
