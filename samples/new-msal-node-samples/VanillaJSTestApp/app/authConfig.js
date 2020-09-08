/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');
const cachePlugin = require('./cachePlugin');

module.exports =  function (scenarioPath) {
    // Get Auth Options from scenario configuration directory
    const authOptions = require(`${scenarioPath}/authOptions`);

    // Build full configuration object
    return {
        auth: authOptions,
        cache: {
            cachePlugin
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
    }
};
