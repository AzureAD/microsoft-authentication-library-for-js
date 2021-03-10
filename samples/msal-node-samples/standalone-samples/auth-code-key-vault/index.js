/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const forge = require('node-forge');

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
    const certResponse = await certClient.getCertificate(CERTIFICATE_NAME);
    const thumbprint = certResponse.properties.x509Thumbprint.toString('hex').toUpperCase();
    
    // When you upload a certificate to Key Vault, a secret containing your private key is automatically created (in PFX)
    const secretResponse = await secretClient.getSecret(CERTIFICATE_NAME);

    // Convert to PFX to PEM and grab the private key
    const privateKey = convertPFX(secretResponse.value).key;

    // Initialize msal and start the server 
    msalApp(thumbprint, privateKey);
}

/**
 * Implements an equivalent of "openssl pkcs12 -in certificate.pfx -out certificate.pem -nodes"
 * using node-forge https://www.npmjs.com/package/node-forge
 * @param {string} pfx: a certificate in pkcs12 format
 * @param {string} passphrase: passphrase used to encrypt pfx file
 * @returns 
 */
function convertPFX(pfx, passphrase = null) {

    const asn = forge.asn1.fromDer(forge.util.decode64(pfx));   
    const p12 = forge.pkcs12.pkcs12FromAsn1(asn, true, passphrase);

    // Retrieve key data
    const keyData = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag]
        .concat(p12.getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag]);

    // Retrieve certificate data
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];
    const certificate = forge.pki.certificateToPem(certBags[0].cert)

    // Convert a forge private key to an ASN.1 RSAPrivateKey
    const rsaPrivateKey = forge.pki.privateKeyToAsn1(keyData[0].key);

    // Wrap an RSAPrivateKey ASN.1 object in a PKCS#8 ASN.1 PrivateKeyInfo
    const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);

    // Convert a PKCS#8 ASN.1 PrivateKeyInfo to PEM
    const privateKey = forge.pki.privateKeyInfoToPem(privateKeyInfo);

    return {
        cert: certificate,
        key: privateKey
    };
}

main();