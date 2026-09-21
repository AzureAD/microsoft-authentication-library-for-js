/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const session = require("express-session");
const msal = require("@azure/msal-node");
const url = require("url");
require("dotenv").config();

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");
const { request } = require("express");

const SERVER_PORT = argv.p || 3000;
const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require("../cachePlugin")(cacheLocation);

/**
 * The scenario string is the name of a .json file which contains the MSAL client configuration
 * For an example of what a configuration file should look like, check out the customConfig.json file in the
 * /config directory.
 *
 * You can create your own configuration file and replace the path inside the "config" require statement below
 * with the path to your custom configuration.
 */
const scenario = argv.s || "customConfig";
const config = require(`./config/${scenario}.json`);

const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    },
};

// Sample Application Code
const getTokenAuthCode = function (scenarioConfig, clientApplication, port) {
    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    app.use(session(sessionConfig));

    const requestConfig = scenarioConfig.request;

    app.get("/", (req, res) => {
        // if redirectUri is set to the main route "/", redirect to "/redirect" route for handling authZ code
        if (req.query.code)
            return res.redirect(
                url.format({ pathname: "/redirect", query: req.query })
            );

        const cryptoProvider = new msal.CryptoProvider();
        const authCodeUrlParameters = {
            ...requestConfig.authCodeUrlParameters,
            state: cryptoProvider.createNewGuid(),
            nonce: cryptoProvider.createNewGuid(),
        };

        if (req.query) {
            // Check for the prompt parameter
            if (req.query.prompt)
                authCodeUrlParameters.prompt = req.query.prompt;

            // Check for the loginHint parameter
            if (req.query.loginHint)
                authCodeUrlParameters.loginHint = req.query.loginHint;

            // Check for the domainHint parameter
            if (req.query.domainHint)
                authCodeUrlParameters.domainHint = req.query.domainHint;
        }

        req.session.nonce = authCodeUrlParameters.nonce;
        req.session.state = authCodeUrlParameters.state;

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
        clientApplication
            .getAuthCodeUrl(authCodeUrlParameters)
            .then((authCodeUrl) => {
                res.redirect(authCodeUrl);
            });
    });

    app.get("/redirect", (req, res) => {
        const expectedState = req.session.state;
        const expectedNonce = req.session.nonce;

        delete req.session.state;
        delete req.session.nonce;

        if (
            !req.query.code ||
            !expectedState ||
            req.query.state !== expectedState
        ) {
            return res.status(400).send("Invalid authorization response.");
        }

        const tokenRequest = {
            ...requestConfig.tokenRequest,
            code: req.query.code,
            nonce: expectedNonce,
            state: expectedState,
        };
        const authCodeResponse = {
            code: req.query.code,
            state: req.query.state,
        };

        /**
         * MSAL Usage
         * The code below demonstrates the correct usage pattern of the ClientApplicaiton.acquireTokenByCode API.
         *
         * Authorization Code Grant: Second Leg
         *
         * In this code block, the application uses MSAL to obtain an Access Token from the configured authentication service.
         * The cached nonce is passed in tokenRequest and validated by MSAL against the nonce claim in the ID Token.
         * The response contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
         * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
         */

        clientApplication
            .acquireTokenByCode(tokenRequest, authCodeResponse)
            .then((response) => {
                console.log(
                    "Successfully acquired token using Authorization Code."
                );
                res.sendStatus(200);
            })
            .catch((error) => {
                res.status(500).send(error.errorMessage);
            });
    });

    return app.listen(serverPort, () =>
        console.log(
            `Msal Node Auth Code Sample app listening on port ${serverPort}!`
        )
    );
};

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample application.
 */
if (argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: true,
        logLevel: msal.LogLevel.Trace,
    };

    // Build MSAL ClientApplication Configuration object
    const clientConfig = {
        auth: {
            clientId: config.authOptions.clientId,
            authority: config.authOptions.authority,
            clientSecret: process.env.CLIENT_SECRET,
            knownAuthorities: config.authOptions.knownAuthorities,
        },
        cache: {
            cachePlugin,
        },
        // Uncomment the code below to enable the MSAL logger
        system: {
            loggerOptions: loggerOptions,
        },
    };

    // Create an MSAL ConfidentialClientApplication object
    const confidentialClientApplication =
        new msal.ConfidentialClientApplication(clientConfig);

    // Execute sample application with the configured MSAL ConfidentialClientApplication
    return getTokenAuthCode(config, confidentialClientApplication, null);
}

// The application code is exported so it can be executed in automation environments
module.exports = getTokenAuthCode;
