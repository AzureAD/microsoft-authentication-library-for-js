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

// Create msal application object
const pca = new msal.PublicClientApplication(config);

// Create Express App and Routes
const app = express();


/**
 * Proof Key for Code Exchange (PKCE) Setup
 * 
 * MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge and codeChallengeMethod parameters
 * in the request passed into getAuthCodeUrl() API, as well as the codeVerifier parameter in the
 * second leg (acquireTokenByCode() API).
 * 
 * MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
 * the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
 * and challenge values should be generated previous to the authorization flow initiation.
 * 
 * For details on PKCE code generation logic, consult the 
 * PKCE specification https://tools.ietf.org/html/rfc7636#section-4
 */

// Set up PKCE Code object in app's local memory so it's shared between routes
app.locals.pkceCodes = {
    challengeMethod: "S256", // Use SHA256 Algorithm
    verifier: "", // Generate a code verifier for the Auth Code Request first
    challenge: "" // Generate a code challenge from the previously generated code verifier
};

app.get('/', (req, res) => {
     // Initialize CryptoProvider instance
    const cryptoProvider = new msal.CryptoProvider();
    // Generate PKCE Codes before starting the authorization flow
    cryptoProvider.generatePkceCodes().then(({ verifier, challenge }) => {
        // Set generated PKCE Codes as app variables
        app.locals.pkceCodes.verifier = verifier;
        app.locals.pkceCodes.challenge = challenge;

        // Add PKCE code challenge and challenge method to authCodeUrl request objectgit st
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: "http://localhost:3000/redirect",
            codeChallenge: app.locals.pkceCodes.challenge, // PKCE Code Challenge
            codeChallengeMethod: app.locals.pkceCodes.challengeMethod // PKCE Code Challenge Method
        };

        console.log(authCodeUrlParameters);
    
        // Get url to sign user in and consent to scopes needed for applicatio
        pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });
});

app.get('/redirect', (req, res) => {
    // Add PKCE code verifier to token request object
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
        codeVerifier: app.locals.pkceCodes.verifier // PKCE Code Verifier
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
