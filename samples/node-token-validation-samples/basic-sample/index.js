/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const nodeTokenValidation = require("@azure/node-token-validation")

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 */
const argv = require("../../msal-node-samples/cliArgs");

const SERVER_PORT = argv.p || 3000;

// Sample Application Code
const validateTokenBasic = function (port) {
    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: nodeTokenValidation.LogLevel.Verbose,
    }

    const config = {
        auth: {
            authority: "https://login.microsoftonline.com/common/",
        },
        system: {
            loggerOptions: loggerOptions
        } 
    };

    app.get("/", (req, res) => {
        const tokenValidator = new nodeTokenValidation.TokenValidator(config);

        // Instead of raw tokens and claims, will write a function to populate this from header or body of request/response
        const token = "token-here";
        const tokenValidationParams = {
            validIssuers: ["issuer-here"],
            validAudiences: ["audience-here"]
        };
        tokenValidator.validateToken(token, tokenValidationParams).then((response) => {
            console.log("Token was validated");
            console.log(response);
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });

    });

    return app.listen(serverPort, () => console.log(`Msal Node Token Validation Basic Sample app listening on port ${serverPort}!`));
}

/**
 * The code below checks if the script is being executed manually or in automation.
 */
if(argv.$0 === "index.js") {
    // Execute sample application with the configured Node Token Validator
    return validateTokenBasic(null);
}

// The application code is exported so it can be executed in automation environments
module.exports = validateTokenBasic;
