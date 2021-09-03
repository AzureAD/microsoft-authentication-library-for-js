/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const path = require("path");
const process = require("process");
const msal = require("@azure/msal-node");
const { 
    DataProtectionScope,
    Environment,
    PersistenceCreator,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");

const SERVER_PORT = process.env.PORT || 3000;
const cachePath = path.join(Environment.getUserRootDirectory(), "./cache.json");

const persistenceConfiguration = {
    cachePath,
    dataProtectionScope: DataProtectionScope.CurrentUser,
    serviceName: "serviceName",
    accountName: "accountName",
    usePlaintextFileOnLinux: false,
}

PersistenceCreator
.createPersistence(persistenceConfiguration)
.then(async (persistence) => {
    const publicClientConfig = {
        auth: {
            clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
            authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        },
        cache: {
            cachePlugin: new PersistenceCachePlugin(persistence)
        }
    };

    const pca = new msal.PublicClientApplication(publicClientConfig);

    // Create Express App and Routes
    const app = express();

    app.get('/', (req, res) => {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: "http://localhost:3000/redirect",
        };

        // get url to sign user in and consent to scopes needed for application
        pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });

    app.get('/redirect', (req, res) => {
        const tokenRequest = {
            code: req.query.code,
            redirectUri: "http://localhost:3000/redirect",
            scopes: ["user.read"],
        };

        pca.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("\nResponse: \n", response);
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });

    app.listen(SERVER_PORT, () => console.log(`Msal Extensions Sample app listening on port ${SERVER_PORT}!`));
});
