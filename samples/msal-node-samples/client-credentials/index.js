/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");

const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require('../cachePlugin')(cacheLocation);

/**
 * The scenario string is the name of a .json file which contains the MSAL client configuration
 * For an example of what a configuration file should look like, check out the customConfig.json file in the
 * /config directory.
 * 
 * You can create your own configuration file and replace the path inside the "config" require statement below
 * with the path to your custom configuraiton.
 */
const runtimeOptions = argv.ro || null;
const config = require(`./config/AAD.json`);

function getClientCredentialsToken(cca, clientCredentialRequestScopes, ro) {
    // With client credentials flows permissions need to be granted in the portal by a tenant administrator. 
    // The scope is always in the format "<resource>/.default"
    const clientCredentialRequest = {
        scopes: clientCredentialRequestScopes,
        azureRegion: ro ? ro.region : null, // (optional) specify the region you will deploy your application to here (e.g. "westus2")
        skipCache: true, // (optional) this skips the cache and forces MSAL to get a new token from Azure AD
    };

    return cca
        .acquireTokenByClientCredential(clientCredentialRequest)
        .then((response) => {
            // Uncomment to see the successful response logged
            // console.log("Response: ", response);
        }).catch((error) => {
            // Uncomment to see the errors logged
            // console.log(JSON.stringify(error));
        });
}

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample client credentials application.
 */
if(argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    }
    
    // Build MSAL ClientApplication Configuration object
    const clientConfig = {
        auth: config.authOptions,
        cache: {
            cachePlugin
        },
        // Uncomment or comment the code below to enable or disable the MSAL logger respectively
        // system: {
        //    loggerOptions,
        // }
    };
    
    // Create msal application object
    const confidentialClientApplication = new msal.ConfidentialClientApplication(clientConfig);

    // Execute sample application with the configured MSAL PublicClientApplication
    return getClientCredentialsToken(confidentialClientApplication, runtimeOptions);
}

module.exports = getClientCredentialsToken;
