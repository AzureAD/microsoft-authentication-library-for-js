
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require('@azure/msal-node');
const http = require('http');

const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = "http://localhost:3000/redirect";
const WEB_API_SCOPE = "api://ENTER_WEB_API_CLIENT_ID/.default";

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
let accessToken = null;

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: [WEB_API_SCOPE],
        redirectUri: REDIRECT_URI,
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: [WEB_API_SCOPE],
        redirectUri: REDIRECT_URI,
    };

    cca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("Response received. Calling web API");
        accessToken = response.accessToken;
        callWebApi(response.accessToken, (oboResponse) => {
            console.log(oboResponse);
            res.status(200).send(oboResponse);
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