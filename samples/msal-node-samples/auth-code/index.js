/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msal = require('@azure/msal-node');

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");

const SERVER_PORT = argv.p || 3000;
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
const scenario = argv.s || "customConfig";
const config = require(`./config/${scenario}.json`);

// Sample Application Code
const getTokenAuthCode = function (scenarioConfig, clientApplication, port) {
    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    const requestConfig = scenarioConfig.request;

    app.get("/", (req, res) => {
        const { authCodeUrlParameters } = requestConfig;
            
        if (req.query) {
            // Check for the state parameter
            if(req.query.state) authCodeUrlParameters.state = req.query.state;

            // Check for the prompt parameter
            if (req.query.prompt) authCodeUrlParameters.prompt = req.query.prompt;

            // Check for the loginHint parameter
            if (req.query.loginHint) authCodeUrlParameters.loginHint = req.query.loginHint;

            // Check for the domainHint parameter
            if (req.query.domainHint) authCodeUrlParameters.domainHint = req.query.domainHint;
        }
        
        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplicaiton.getAuthCodeUrl API.
         * 
         * Authorization Code Grant: First Leg
         * 
         * In this code block, the application uses MSAL to obtain an authorization code request URL. Once the URL is
         * returned by MSAL, the express application is redirected to said request URL, concluding the first leg of the
         * Authorization Code Grant flow.
         */
        clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((authCodeUrl) => {
            res.redirect(authCodeUrl);
        }).catch((error) => console.log(JSON.stringify(error)));
    });

    app.get("/redirect", (req, res) => {
        const tokenRequest = { ...requestConfig.tokenRequest, code: req.query.code };
        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplicaiton.acquireTokenByCode API.
         * 
         * Authorization Code Grant: Second Leg
         * 
         * In this code block, the application uses MSAL to obtain an Access Token from the configured authentication service.
         * The response contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
         * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
         */

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
    
    // Create an MSAL PublicClientApplication object 
    const publicClientApplication = new msal.PublicClientApplication(clientConfig);

    // Execute sample application with the configured MSAL PublicClientApplication
    return getTokenAuthCode(config, publicClientApplication, null);
 }

// The application code is exported so it can be executed in automation environments
 module.exports = getTokenAuthCode;