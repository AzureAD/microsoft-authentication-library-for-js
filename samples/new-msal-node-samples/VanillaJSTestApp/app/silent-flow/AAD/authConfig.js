/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');
const cachePlugin = require('../cachePlugin');

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
module.exports =  {
    auth: {
        clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
    },
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
};




// const authority = {
//     AADAuthority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
//     CommonAuthority: "https://login.microsoftonline.com/common"
// }

// module.exports = {
//     /**
//      * Public Client Application Configuration
//      */
//     auth: {
//         clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
//         authority: authority.AADAuthority,
//         redirectUri: "http://localhost:3000/redirect",
//     },
//     cache: {
//         cachePlugin,
//     },
// };
