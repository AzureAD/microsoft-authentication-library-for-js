/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require('fs');
const crypto = require('crypto');
const express = require('express');

const msal = require('@azure/msal-node');

/**
 * If you have encrypted your private key with a *pass phrase* as recommended,
 * you'll need to decrypt it before passing it to msal-node for initialization.
 */
// Secrets should never be hardcoded. The dotenv npm package can be used to store secrets or certificates
// in a .env file (located in project's root directory) that should be included in .gitignore to prevent
// accidental uploads of the secrets.

// Certificates can also be read-in from files via NodeJS's fs module. However, they should never be
// stored in the project's directory. Production apps should fetch certificates from
// Azure KeyVault (https://azure.microsoft.com/products/key-vault), or other secure key vaults.

// Please see "Certificates and Secrets" (https://learn.microsoft.com/azure/active-directory/develop/security-best-practices-for-app-registration#certificates-and-secrets)
// for more information.
const privateKeySource = fs.readFileSync('<path_to_key>/certs/example.key');

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
            thumbprint: process.env.ENTER_CERTIFICATE_THUMBPRINT, // can be obtained when uploading certificate to Azure AD
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

app.use(express.urlencoded({ extended: false }));

app.get('/', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
        responseMode: 'form_post',
    };

    // get url to sign user in and consent to scopes needed for application
    cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    });
});

app.post('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.body.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
    };

    cca.acquireTokenByCode(tokenRequest).then((response) => {
        res.status(200).send('Congratulations! You have signed in successfully');
    }).catch((error) => {
        res.status(500).send(error.errorMessage);
    });
});

const SERVER_PORT = process.env.PORT || 3000;

app.listen(SERVER_PORT, () => {
    console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`)
});
