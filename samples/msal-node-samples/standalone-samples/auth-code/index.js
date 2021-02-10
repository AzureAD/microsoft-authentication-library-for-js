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

// Create msal application object
const clientApplication = new msal.PublicClientApplication(clientConfig);

// Create Express App and Routes
const app = express();

const requestConfig = config.request;

const SERVER_PORT = argv.p || 3000;

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
        res.sendStatus(200);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
