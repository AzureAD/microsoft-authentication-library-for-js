/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msIdentity = require("@azure/ms-identity-node")

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 */
const argv = require("../../msal-node-samples/cliArgs");

const SERVER_PORT = argv.p || 3000;

// Sample Application Code
const getTokenAuthCode = function (port) {
    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;
    // Create Express App and Routes
    const app = express();

    const config = {
        authority: "https://login.microsoftonline.com/common/"
    };

    app.get("/", (req, res) => {
        const tokenValidator = new msIdentity.TokenValidator(config);

        // Instead of raw tokens and claims, will write a function here to populate this from header or body of request
        const rawToken = "raw-id-token";
        const tokenValidationParams = {
            rawTokenString: rawToken,
            issuer: "issuer-here",
            audience: "audience-here"
        };
        tokenValidator.validateToken(tokenValidationParams).then((response) => {
            // Check that token is valid
            console.log("Token was validated");
            console.log(response);
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
 */
if(argv.$0 === "index.js") {
    // Execute sample application with the configured MSAL PublicClientApplication
    return getTokenAuthCode(null);
}

// The application code is exported so it can be executed in automation environments
module.exports = getTokenAuthCode;
