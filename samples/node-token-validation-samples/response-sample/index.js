/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const session = require("express-session")
const msal = require('@azure/msal-node');
const nodeTokenValidation = require("@azure/node-token-validation")

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("./cliArgs");
const { request } = require("express");

const SERVER_PORT = argv.p || 3000;
const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require('./cachePlugin')(cacheLocation);
const scenario = argv.s || "customConfig";
const config = require(`./config/${scenario}.json`);

const sessionConfig = {
    secret: 'ENTER_YOUR_SECRET_HERE',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}

// Sample Application Code
const getTokenAuthCode = function (scenarioConfig, clientApplication, tokenValidator, port) {
    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    app.use(session(sessionConfig))

    const requestConfig = scenarioConfig.request;

    app.get("/", (req, res) => {
        const { authCodeUrlParameters } = requestConfig;

        const cryptoProvider = new msal.CryptoProvider()
            
        if (req.query) {
            // Check for the state parameter
            if(req.query.state) authCodeUrlParameters.state = req.query.state;

            // Check for nonce parameter
            if(req.query.nonce) {
                authCodeUrlParameters.nonce = req.query.nonce
            } else {
                authCodeUrlParameters.nonce = cryptoProvider.createNewGuid()
            }

            // Check for the prompt parameter
            if (req.query.prompt) authCodeUrlParameters.prompt = req.query.prompt;

            // Check for the loginHint parameter
            if (req.query.loginHint) authCodeUrlParameters.loginHint = req.query.loginHint;

            // Check for the domainHint parameter
            if (req.query.domainHint) authCodeUrlParameters.domainHint = req.query.domainHint;
        }

        req.session.nonce = authCodeUrlParameters.nonce //switch to a more persistent storage method.
        
        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplication.getAuthCodeUrl API.
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
        const authCodeResponse = { nonce: req.session.nonce, code: req.query.code }

        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplication.acquireTokenByCode API.
         * 
         * Authorization Code Grant: Second Leg
         * 
         * In this code block, the application uses MSAL to obtain an Access Token from the configured authentication service.
         * The cached nonce is passed in authCodeResponse object and shall later be validated by MSAL once the Access Token and ID 
         * token are returned.
         * The response contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
         * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
         */

        clientApplication.acquireTokenByCode(tokenRequest, authCodeResponse).then((response) => {
            console.log("Successfully acquired token using Authorization Code.");
            
            /**
             * Id Token options to be passed into the TokenValidator.validateTokenFromResponse API.
             * 
             * A separate object for access token options can also be passed in to the API to validate access tokens on the response.
             */
            const idTokenOptions = {
                validIssuers: config.validationParams.idTokenOptions.validIssuers,
                validAudiences: config.validationParams.idTokenOptions.validAudiences,
                nonce: response.idTokenClaims.nonce
            };

            /**
             * Uncomment accessTokenOptions and add to line 138 if wanting to validate access token with custom scopes
             */
            // const accessTokenOptions = {
                // validIssuers: config.validationParams.accessTokenOptions.validIssuers,
                // validAudiences: config.validationParams.accessTokenOptions.validAudiences,
            // }

            /**
             * Node Token Validation Usage
             * The code below demonstrates the correct usage pattern of the TokenValidator.validateTokenFromResponse API.
             * 
             * The response from MSAL along with id token or access token options are passed in, 
             * containing the claims the token is to be validated against.
             * 
             * If successful, a response will be returned from the Token Validator containing the decoded header and payload from the token.
             * If multiple tokens are validated, the response will be an array.
             * Unsuccessful validation will throw an error.
             */
            tokenValidator.validateTokenFromResponse(response, idTokenOptions).then((response) => {
                console.log(`Token validation complete. Token validation response: `, response);
                res.sendStatus(200);
            }).catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });

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
        logLevel: nodeTokenValidation.LogLevel.Verbose,
    }
    
    // Build MSAL ClientApplication Configuration object. Uncomment code to see MSAL logs
    const clientConfig = {
        auth: config.authOptions,
        cache: {
            cachePlugin
        },
        // system: {
        //     loggerOptions: loggerOptions
        // } 
    };
    
    // Create an MSAL PublicClientApplication object 
    const publicClientApplication = new msal.PublicClientApplication(clientConfig);

    // Build Node Token Validator Configuration object
    const tokenValidationConfig = {
        auth: {
            authority: config.authOptions.authority,
            protocolMode: config.authOptions.protocolMode
        },
        system: {
            loggerOptions: loggerOptions
        } 
    };

    // Create a Node TokenValidator object
    const tokenValidator = new nodeTokenValidation.TokenValidator(tokenValidationConfig);

    // Execute sample application with the configured MSAL PublicClientApplication
    return getTokenAuthCode(config, publicClientApplication, tokenValidator, null);
 }

// The application code is exported so it can be executed in automation environments
 module.exports = getTokenAuthCode;