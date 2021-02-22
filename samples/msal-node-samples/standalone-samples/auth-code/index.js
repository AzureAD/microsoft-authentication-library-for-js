/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msal = require('@azure/msal-node');

const argv = require('yargs')
    .usage('Usage: $0 -p [PORT]')
    .alias('p', 'port')
    .alias('s', 'scenario')
    .alias('c', 'cache location')
    .describe('port', '(Optional) Port Number - default is 3000')
    .describe('scenario', '(Optional) Scenario name - default is AAD')
    .describe('cache location', '(Optional) Cache location - default is data/cache.json')
    .strict()
    .argv;

    

const SERVER_PORT = argv.p || 3000;
const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require('../cachePlugin')(cacheLocation);

const scenario = argv.s || "AAD";


const config = require(`./config/${scenario}.json`);

const getTokenAuthCode = function (scenarioConfig, clientApplication, port) {
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    const requestConfig = scenarioConfig.request;

    app.get("/", (req, res) => {
        const { authCodeUrlParameters } = requestConfig;
            
        // Check for the state parameter
        if (req.query && req.query.state) authCodeUrlParameters.state = req.query.state;

        // Check for the prompt parameter
        if (req.query && req.query.prompt) authCodeUrlParameters.prompt = req.query.prompt;

        // Check for the loginHint parameter
        if (req.query && req.query.loginHint) authCodeUrlParameters.loginHint = req.query.loginHint;

        // Check for the domainHint parameter
        if (req.query && req.query.domainHint) authCodeUrlParameters.domainHint = req.query.domainHint;
        
        // get url to sign user in and consent to scopes needed for applicatio
        clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });

    app.get("/redirect", (req, res) => {
        const tokenRequest = { ...requestConfig.tokenRequest, code: req.query.code };
        
        clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("Successfully acquired token using Authorization Code.");
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });

    return app.listen(serverPort, () => console.log(`Msal Node Auth Code Sample app listening on port ${serverPort}!`));
}



 // Check if the script is being executed manually and execute app, otherwise just export getDeviceCode
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
        // Uncomment the code below to enable the MSAL logger
        /*
         *   system: {
         *    loggerOptions: loggerOptions
         *   } 
         */
    };
    
    // Create msal application object
    const clientApplication = new msal.PublicClientApplication(clientConfig);
    return getTokenAuthCode(config, clientApplication, null);

 }

 module.exports = getTokenAuthCode;