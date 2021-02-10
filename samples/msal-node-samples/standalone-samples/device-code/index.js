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
    .describe('port', '(Optional) Port Number - default is 3000')
    .describe('cache location', '(Optional) Cache location - default is data/cache.json')
    .strict()
    .argv;

let cacheLocation;
if (argv.c) {
    cacheLocation = argv.c;
} else {
    cacheLocation = "./data/cache.json";
}

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
console.log(clientConfig);

const pca = new msal.PublicClientApplication(clientConfig);

getDeviceCode(config, pca, runtimeOptions);

const getDeviceCode = function(scenarioConfig, clientApplication, runtimeOptions) {
    const requestConfig = scenarioConfig.request;
    const defaultCallback = (response) => console.log(response.message);

    const deviceCodeRequest = { 
        ...requestConfig.deviceCodeUrlParameters,
        deviceCodeCallback: runtimeOptions.deviceCodeCallback || defaultCallback
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

 module.exports = getDeviceCode;