/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */


const express = require("express");
const msal = require('@azure/msal-node');
const config = require("./authConfig.json");

const argv = require('yargs')
    .usage('Usage: $0 -p [PORT]')
    .alias('p', 'port')
    .alias('c', 'cache location')
    .alias('ro', 'runtime-options')
    .describe('port', '(Optional) Port Number - default is 3000')
    .describe('cache location', '(Optional) Cache location - default is data/cache.json')
    .describe('runtime-options', '(Optional) Runtime options to inject into the application - default is null')
    .strict()
    .argv;

const cacheLocation = argv.c || "./data/cache.json";
const runtimeOptions = argv.ro || null;
const cachePlugin = require('../cachePlugin')(cacheLocation);

const loggerOptions = {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
        piiLoggingEnabled: false,
    logLevel: msal.LogLevel.Verbose,
}

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

const pca = new msal.PublicClientApplication(clientConfig);

const getDeviceCode = function(scenarioConfig, clientApplication, runtimeOptions) {
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
    
    return clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        return response;
    }).catch((error) => {
        return error;
    });
 }

 // Check if the script is being executed manually and execute app, otherwise just export getDeviceCode
 if(argv.$0 === "index.js") {
    getDeviceCode(config, pca, runtimeOptions).then(response => {
        console.log(response);
    });

 }

 module.exports = getDeviceCode;