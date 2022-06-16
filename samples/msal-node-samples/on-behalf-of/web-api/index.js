/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const https = require('https');
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');

const SERVER_PORT = process.env.PORT || 8000;
const DISCOVERY_KEYS_ENDPOINT = "https://login.microsoftonline.com/ENTER_TENANT_INFO/discovery/v2.0/keys";

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: "ENTER_CLIENT_SECRET",
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// Create Express App and Routes
const app = express();

const validateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        
        const validationOptions = {
            audience: config.auth.clientId, // v2.0 token
            issuer: config.auth.authority + "/v2.0" // v2.0 token
        }

        jwt.verify(token, getSigningKeys, validationOptions, (err, payload) => {
            if (err) {
                console.log(err);
                return res.sendStatus(403);
            }

            next();
        });
    } else {
        res.sendStatus(401);
    }
};

const getSigningKeys = (header, callback) => {
    var client = jwksClient({
        jwksUri: DISCOVERY_KEYS_ENDPOINT
    });

    client.getSigningKey(header.kid, function (err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

app.get('/obo', validateJwt, (req, res) => {
    const authHeader = req.headers.authorization;

    const oboRequest = {
        oboAssertion: authHeader.split(' ')[1],
        scopes: ["user.read"],
    }

    cca.acquireTokenOnBehalfOf(oboRequest).then((response) => {
        console.log(response);
        callGraph(response.accessToken, (graphResponse) => {
            res.status(200).send(graphResponse);
        });
    }).catch((error) => {
        res.status(500).send(error);
    });
});

const callGraph = (accessToken, callback) => {
    const options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    const req = https.request(new URL("https://graph.microsoft.com/v1.0/me"), options, (res) => {
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            callback(chunk);
        });
    });
    req.on('error', (err) => {
        console.log(err);
    });
    req.end();
}

app.listen(SERVER_PORT, () => console.log(`Msal Node Web API listening on port ${SERVER_PORT}!`))