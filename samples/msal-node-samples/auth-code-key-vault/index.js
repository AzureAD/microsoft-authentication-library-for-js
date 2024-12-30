/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msal = require("@azure/msal-node");
const identity = require("@azure/identity");
const keyvaultCert = require("@azure/keyvault-certificates");
const keyvaultSecret = require("@azure/keyvault-secrets");
const crypto = require("crypto");

// App constants
const SERVER_PORT = process.env.PORT || 3000;
const REDIRECT_URI = process.env["REDIRECT_URI"] || "http://localhost:3000/redirect";

// Importing from key vault
const KEY_VAULT_NAME = process.env["KEY_VAULT_NAME"] || "ENTER_YOUR_KEY_VAULT_NAME";
const KVUri = "https://" + KEY_VAULT_NAME + ".vault.azure.net";

const CERTIFICATE_NAME = process.env["CERTIFICATE_NAME"] || "ENTER_THE_NAME_OF_YOUR_CERTIFICATE_ON_KEY_VAULT";

// Initialize Azure SDKs
const credential = new identity.DefaultAzureCredential();
const certClient = new keyvaultCert.CertificateClient(KVUri, credential);
const secretClient = new keyvaultSecret.SecretClient(KVUri, credential);

function msalApp(thumbprint, privateKey) {
    // Before running the sample, you will need to replace the values in the config
    const config = {
        auth: {
            clientId: "ENTER_CLIENT_ID",
            authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
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

    app.use(express.urlencoded({ extended: false }));

    app.get("/", (req, res) => {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
            responseMode: "form_post",
        };

        // get url to sign user in and consent to scopes needed for application
        cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        });
    });

    app.post("/redirect", (req, res) => {
        const tokenRequest = {
            code: req.body.code,
            scopes: ["user.read"],
            redirectUri: REDIRECT_URI,
        };

        cca.acquireTokenByCode(tokenRequest).then((response) => {
            res.status(200).send("Congratulations! You have signed in successfully");
        }).catch((error) => {
            res.status(500).send(error);
        });
    });

    app.listen(SERVER_PORT, () => {
        console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`);
    });
}

async function main() {
    let certResponse;
    try {
        // Grab the certificate thumbprint from the Key Vault
        certResponse = await certClient.getCertificate(CERTIFICATE_NAME);
    } catch (error) {
        console.log("Error retrieving certificate from Key Vault:", error);
        return;
    }

     // Validate the certificate and extract the thumbprint safely
     let thumbprint;
     try {
         // Attempt to extract the thumbprint
         thumbprint = certResponse.properties.x509Thumbprint.toString("hex");
     } catch (error) {
         console.log("Error extracting thumbprint from certificate:", error);
         return;
     }

    let secretResponse;
    try {
        // When you upload a certificate to Key Vault, a secret containing your private key is automatically created
        secretResponse = await secretClient.getSecret(CERTIFICATE_NAME);
    } catch (error) {
        console.log("Error retrieving private key from Key Vault:", error);
        return;
    }

    let combinedData = secretResponse.value;
    let privateKey = null;

    // Check if the combined data contains both public and private key parts (combined case)
    if (combinedData.includes('-----BEGIN CERTIFICATE-----') && combinedData.includes('-----BEGIN PRIVATE KEY-----')) {
        console.log("Found combined certificate and private key.");

        try {
            // Split the combined string to isolate the private key part
            const parts = combinedData.split('-----BEGIN CERTIFICATE-----');
            if (parts.length > 1) {
                privateKey = parts[1].split('-----BEGIN PRIVATE KEY-----')[1];

                // Ensure private key is correctly formatted
                if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                    throw new Error("Invalid private key format.");
                }
                console.log("Private key extracted successfully from combined data.");
            } else {
                throw new Error("Combined data format is incorrect.");
            }
        } catch (error) {
            console.log("Error extracting private key from combined data:", error);
            return;
        }
    } else {
        console.log("Assuming certificate and private key are separate.");
        // Handle the case where the certificate and private key are stored separately
        try {
            // Fetch the private key separately if not combined
            const privateKeyResponse = await secretClient.getSecret(CERTIFICATE_NAME + "-private"); // Assuming the private key is stored in a different secret
            privateKey = privateKeyResponse.value;

            if (!privateKey || !privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
                throw new Error("Invalid private key format.");
            }
            console.log("Private key retrieved successfully from separate secret.");
        } catch (error) {
            console.log("Error retrieving private key from Key Vault:", error);
            return;
        }
    }

    // Validate the private key by attempting to parse it
    try {
        const keyBuffer = Buffer.from(privateKey, "base64");
        const key = crypto.createPrivateKey({
            key: keyBuffer,
            format: "pem",
            type: "pkcs8",
        });

        if (!key) {
            console.log("Invalid private key data.");
            return;
        }
        console.log("Private key validated successfully.");
    } catch (error) {
        console.log("Private key validation failed:", error);
        return;
    }

    // Now initialize msal and start the server with the valid thumbprint and private key
    msalApp(thumbprint, privateKey);
}

main();
