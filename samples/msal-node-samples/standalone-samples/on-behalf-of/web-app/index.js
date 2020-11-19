
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require('@azure/msal-node');
const http = require('http')

const SERVER_PORT = process.env.PORT || 3000;

// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "12d77c73-d09d-406a-ae0d-3d4e576f7d9b",
        authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        clientSecret: "",
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// Create Express App and Routes
const app = express();
let accessToken = null;

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["api://81f752bc-1fd5-4ecf-bd58-74b556e9b46e/OboScope"],
        redirectUri: "http://localhost:3000/redirect",
    };

    // get url to sign user in and consent to scopes needed for applicatio
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["api://81f752bc-1fd5-4ecf-bd58-74b556e9b46e/OboScope"],
        redirectUri: "http://localhost:3000/redirect",
    };

    cca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("Response received. Calling web API");
        accessToken = response.accessToken;
        callWebApi(response.accessToken, (oboResponse) => {
            console.log(oboResponse);
            res.sendStatus(200);
        });
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.get('/oboCall', (req, res) => {
    callWebApi(accessToken, (oboResponse) => {
        console.log(oboResponse);
        res.sendStatus(200);
    });
});

const callWebApi = (accessToken, callback) => {
    const options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    const req = http.request(new URL("http://localhost:8000/obo"), options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
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

app.listen(SERVER_PORT, () => console.log(`Msal Node web app listening on port ${SERVER_PORT}!`))