/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require('@azure/msal-node');

const SERVER_PORT = process.env.PORT || 3000;

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "89e61572-2f96-47ba-b571-9d8c8f96b69d",
        authority: "https://login.microsoftonline.com/5d97b14d-c396-4aee-b524-c86d33e9b660"
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

/**
 * PKCE Setup
 * 
 * MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge and codeChallengeMethod parameters
 * in the request passed into getAuthCodeUrl() API, as well as the codeVerifier parameter in the
 * second leg (acquireTokenByCode() API).
 * 
 * Generating the codeVerifier and the codeChallenge is the client application's responsiblity.
 * For this sample, you can either implement your own PKCE code generation logic or use an existing tool
 * to manually generate a Code Verifier and Code Challenge, plugging them into the pkceCodes object below.
 * 
 * For details on implementing your own PKCE code generation logic, consult the 
 * PKCE specification https://tools.ietf.org/html/rfc7636#section-4
 */

const PKCE_CODES = {
    CHALLENGE_METHOD: "S256", // Use SHA256 Algorithm
    VERIFIER: "", // Generate a code verifier for the Auth Code Request first
    CHALLENGE: "" // Generate a code challenge from the previously generated code verifier
};

// Create msal application object
const pca = new msal.PublicClientApplication(config);

// Create Express App and Routes
const app = express();

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
        codeChallenge: PKCE_CODES.CHALLENGE, // PKCE Code Challenge
        codeChallengeMethod: PKCE_CODES.CHALLENGE_METHOD // PKCE Code Challenge Method
    };

    // get url to sign user in and consent to scopes needed for applicatio
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
        codeVerifier: PKCE_CODES.VERIFIER // PKCE Code Verifier
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.sendStatus(200);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
