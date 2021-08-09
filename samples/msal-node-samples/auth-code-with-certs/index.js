/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const express = require('express');

const msal = require('@azure/msal-node');

/**
 * If you have encrypted your private key with a *pass phrase* as recommended,
 * you'll need to decrypt it before passing it to msal-node for initialization.
 */
const privateKeySource = fs.readFileSync('./certs/example.key');

const privateKeyObject = crypto.createPrivateKey({
    key: privateKeySource,
    passphrase: "2255", // enter your certificate passphrase here
    format: 'pem'
});

const privateKey = privateKeyObject.export({
    format: 'pem',
    type: 'pkcs8'
});

// Before running the sample, you will need to replace the values in the config
const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        clientCertificate: {
            thumbprint: "ENTER_CERTIFICATE_THUMBPRINT", // can be obtained when uploading certificate to Azure AD
            privateKey: privateKey,
        }
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

// Create Express app
const app = express();

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "https://localhost:3000/redirect",
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        console.log(response);
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: "https://localhost:3000/redirect",
    };

    cca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.status(200).send('Congratulations! You have signed in successfully');
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

const SERVER_PORT = process.env.PORT || 3000;

// (Optional) Initialize an HTTPS server with certificates
const options = {
    key: fs.readFileSync(path.join(__dirname + "/certs/example.key")),
    cert: fs.readFileSync(path.join(__dirname + "/certs/example.crt")),
    passphrase: "2255" // enter your certificate passphrase here 
};

const server = https.createServer(options, app);

server.listen(SERVER_PORT, () => {
    console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`)
});