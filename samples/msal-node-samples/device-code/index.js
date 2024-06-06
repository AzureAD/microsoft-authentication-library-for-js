/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const msal = require('@azure/msal-node');

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");


const cacheLocation = argv.c || "./data/cache.json";
const runtimeOptions = argv.ro || null;
const cachePlugin = require('../cachePlugin')(cacheLocation);

/**
 * The scenario string is the name of a .json file which contains the MSAL client configuration
 * For an example of what a configuration file should look like, check out the AAD.json file in the
 * /config directory.
 * 
 * You can create your own configuration file and replace the path inside the "config" require statement below
 * with the path to your custom configuraiton.
 */
const scenario = argv.s || "AAD";
const config = require(`./config/${scenario}.json`);

// Sample Application Code
const getTokenDeviceCode = function (scenarioConfig, clientApplication, runtimeOptions) {
    const requestConfig = scenarioConfig.request;

    if (!runtimeOptions) {
        runtimeOptions = {
            deviceCodeCallback:  (response) => console.log(response.message)
        }
    }

    const deviceCodeRequest = { 
        ...requestConfig.deviceCodeUrlParameters,
        deviceCodeCallback: runtimeOptions.deviceCodeCallback
    };

    // Check if a timeout was provided at runtime.
    if (runtimeOptions.timeout) {
        deviceCodeRequest.timeout = runtimeOptions.timeout;
    }
            
    /**
     * MSAL Usage
     * The code below demonstrates the correct usage pattern of the ClientApplicaiton.acquireTokenByDeviceCode API.
     * 
     * Device Code Grant
     * 
     * In this code block, the application uses MSAL to obtain an Access Token through the Device Code grant.
     * Once the device code request is executed, the user will be prompted by the console application to visit a URL,
     * where they will input the device code shown in the console. Once the code is entered, the promise below should resolve
     * with an AuthenticationResult object.
     * 
     * The AuthenticationResult contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
     * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
     */
    return clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        return response;
    }).catch((error) => {
        return error;
    });
 }


/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a PublicClientApplication object
 * and execute the sample application.
 */
 if(argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
            piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    }
    
    // Build MSAL Client Configuration from scenario configuration file
    const clientConfig = {
        auth: config.authOptions,
        cache: {
            cachePlugin
        },
        // Uncomment the code below to enable the MSAL logger
        /*
         *   system: {
         *    loggerOptions: loggerOptions
         *   } 
         */
    };
    
    // Create an MSAL PublicClientApplication object 
    const pca = new msal.PublicClientApplication(clientConfig);
    getTokenDeviceCode(config, pca, runtimeOptions).then(response => {
        console.log(response);
    });
 }

 module.exports = getTokenDeviceCode;