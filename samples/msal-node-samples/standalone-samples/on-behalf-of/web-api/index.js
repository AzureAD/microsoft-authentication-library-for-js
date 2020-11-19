/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msal = require('@azure/msal-node');
const jwt = require('jsonwebtoken')
const jwksClient = require('jwks-rsa');
const https = require('https')

const SERVER_PORT = process.env.PORT || 8000;

const validateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        const validationOptions = {
            audience: config.auth.clientId,
            issuer: config.auth.authority + "/v2.0"
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
        jwksUri: 'https://login.microsoftonline.com/common/discovery/keys'
    });

    client.getSigningKey(header.kid, function (err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
    });
}

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "81f752bc-1fd5-4ecf-bd58-74b556e9b46e",
        authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        clientSecret: "",
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// Create Express App and Routes
const app = express();

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