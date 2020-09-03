/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');
const cachePlugin = require('./cachePlugin');
const fs = require('fs');

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
module.exports =  function (authorityConfigSubdir) {
    // Get Authority Type Specific App registration configuration
    const authOptions = require(`./${authorityConfigSubdir}/authOptions`);

    // Build full configuration object
    return {
        auth: authOptions,
        cache: {
            cachePlugin
        },
    //     system: {
    //         loggerOptions: {
    //             loggerCallback(loglevel, message, containsPii) {
    //                 console.log(message);
    //             },
    //             piiLoggingEnabled: false,
    //             logLevel: msal.LogLevel.Verbose,
    //         }
    //     }
    }
};
