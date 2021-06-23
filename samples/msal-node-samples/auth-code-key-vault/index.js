/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');

const msal = require('@azure/msal-node');
const identity = require("@azure/identity");
const keyvaultCert = require("@azure/keyvault-certificates");
const keyvaultSecret = require('@azure/keyvault-secrets');

// App constants
const SERVER_PORT = process.env.PORT || 3000;
const CERTIFICATE_NAME = process.env["CERTIFICATE_NAME"] || "NAME_OF_YOUR_CERTIFICATE_ON_KEY_VAULT";
const REDIRECT_URI = process.env["REDIRECT_URI"] || "http://localhost:3000/redirect";

// Importing from key vault
const KEY_VAULT_NAME = process.env["KEY_VAULT_NAME"] || "YOUR_KEY_VAULT_NAME";
const KVUri = "https://" + KEY_VAULT_NAME + ".vault.azure.net";

// Initialize Azure SDKs
const credential = new identity.DefaultAzureCredential();
const certClient = new keyvaultCert.CertificateClient(KVUri, credential);
const secretClient = new keyvaultSecret.SecretClient(KVUri, credential);

function msalApp(thumbprint, privateKey) {

    // Before running the sample, you will need to replace the values in the config
    const config = {
        auth: {
            clientId: "ENTER_CLIENT_ID",
            authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
            clientCertificate: {
                thumbprint: thumbprint,
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

    // Create Express App and Routes
    const app = express();

    app.get('/', (req, res) => {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
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
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };

        cca.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("\nResponse: \n:", response);
            res.status(200).send('Congratulations! You have signed in successfully');
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });

    app.listen(SERVER_PORT, () => {
        console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`)
    });
}

async function main() {

    // Grab the certificate thumbprint
    const certResponse = await certClient.getCertificate(CERTIFICATE_NAME).catch(err => console.log(err));
    const thumbprint = certResponse.properties.x509Thumbprint.toString('hex')
    
    // When you upload a certificate to Key Vault, a secret containing your private key is automatically created
    const secretResponse = await secretClient.getSecret(CERTIFICATE_NAME).catch(err => console.log(err));;

    // secretResponse contains both public and private key, but we only need the private key
    const privateKey = secretResponse.value.split('-----BEGIN CERTIFICATE-----\n')[0]

    // Initialize msal and start the server 
    msalApp(thumbprint, privateKey);
}

main();