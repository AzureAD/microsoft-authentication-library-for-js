/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msal = require("@azure/msal-node");
const extensions = require("@azure/msal-node-extensions");
const process = require("process");
const path = require("path");

const SERVER_PORT = process.env.PORT || 3000;
const cachePath = path.join(__dirname, "./cache.json");

createPersistence().then((filePersistence) => {
    const publicClientConfig = {
        auth: {
            clientId: "8fcb9fc1-d8f9-49c0-b80e-a8a8a201d051",
            authority: "https://login.windows-ppe.net/common/"
        },
        cache: {
            cachePlugin: new extensions.PersistenceCachePlugin(filePersistence)
        },
    };

    const pca = new msal.PublicClientApplication(publicClientConfig);

    // Create Express App and Routes
    const app = express();
    
    // Set homeAccountId in memory
    app.locals.homeAccountId = null;

    app.get('/', (req, res) => {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: "http://localhost:3000/redirect",
        };

        // get url to sign user in and consent to scopes needed for application
        pca.getAuthCodeUrl(authCodeUrlParameters)
            .then((response) => {
                res.redirect(response);
            })
            .catch((error) => console.log(JSON.stringify(error)));
    });

    app.get('/redirect', (req, res) => {
        const tokenRequest = {
            code: req.query.code,
            redirectUri: "http://localhost:3000/redirect",
            scopes: ["user.read"],
        };

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                app.locals.homeAccountId = response.account.homeAccountId;
                console.log("\nResponse: \n", response);
                res.status(200)
                    .send(`
                        <h3>Successfully authenticated!</h3>
                        <p>User <b>${response.account.username}</b> successfully authenticated with the home account Id (${response.account.homeAccountId})</p>
                        <h5>Related links:</h5>
                        <ul>
                            <li>
                                <a href="http://localhost:3000/cache">Access cache</a>
                            </li>
                        </ul>
                    `);
            })
            .catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });
    });

    app.get('/cache', async (req, res) => {
        const cache = pca.getTokenCache();
        const accounts = await cache.getAllAccounts();
        const authenticatedAccount = await cache.getAccountByHomeId(app.locals.homeAccountId);

        if (accounts.length) {
            res.status(200)
            .json({
                authenticatedAccount,
                accounts,
            });
        } else {
            res.status(200)
            .send('No accounts found in the cache.');
        }
    });

    app.listen(SERVER_PORT, () => console.log(`Msal Extensions Sample app listening on port ${SERVER_PORT}!`));
});

/**
 * Builds persistence based on operating system. Falls back to storing in plain text.
 */
async function createPersistence() {
    // On Windows, uses a DPAPI encrypted file
    if (process.platform === "win32") {
        return extensions.FilePersistenceWithDataProtection.create(cachePath, extensions.DataProtectionScope.CurrentUser);
    }

    // On Mac, uses keychain.
    if (process.platform === "darwin") {
        return extensions.KeychainPersistence.create(cachePath, "serviceName", "accountName"); // Replace serviceName and accountName
    }

    // On Linux, uses  libsecret to store to secret service. Libsecret has to be installed.
    if (process.platform === "linux") {
        return extensions.LibSecretPersistence.create(cachePath, "serviceName", "accountName"); // Replace serviceName and accountName
    }

    throw new Error("Could not create persistence. Platform not supported");
}
