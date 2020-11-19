/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');

// Create msal application object
module.exports = async function(scenarioConfiguration, cacheLocation) {

    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
            piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    }
        
    const cachePlugin = await require('./cachePlugin')(cacheLocation);

    // Build full MSAL Client configuration object
    const clientConfig = {
        auth: scenarioConfiguration.authOptions,
        cache: {
            cachePlugin
        },
        // Uncomment the code below to enable the MSAL logger
        /**
        * system: {
        *   loggerOptions: loggerOptions
        * }
        */
    }

    const clientType = scenarioConfiguration.sample.clientType;

    // Build MSAL Client Application depending on the Client type
    switch(clientType) {
        case "public":
            return new msal.PublicClientApplication(clientConfig);
        case "confidential":
            return new msal.ConfidentialClientApplication(clientConfig);
        default:
            console.log("Unsopported clientType: ", clientType);
            return null;
    }
}