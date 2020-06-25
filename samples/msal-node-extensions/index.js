/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const msal = require('@azure/msal-node');
const extensions = require("msal-node-extensions");
const {promises: fs} = require("fs");
const path = require("path");

const SERVER_PORT = process.env.PORT || 3000;
const cachePath = path.join(__dirname, "./cache.json");

extensions.FilePersistenceWithDataProtection.create(cachePath, extensions.DataProtectionScope.LocalMachine)
    .then((filePersistence) => {
            const cachePlugin = new extensions.PersistenceCachePlugin(filePersistence);

            const publicClientConfig = {
                auth: {
                    clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
                    authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
                    redirectUri: "http://localhost:3000/redirect",
                },
                cache: {
                    cachePlugin: cachePlugin
                },
            };
            const pca = new msal.PublicClientApplication(publicClientConfig);
            const msalCacheManager = pca.getCacheManager();

            // Create Express App and Routes
            const app = express();

            app.get('/', (req, res) => {
                const authCodeUrlParameters = {
                    scopes: ["openid"],
                    redirectUri: "http://localhost:3000/redirect",
                };

                // get url to sign user in and consent to scopes needed for application
                pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
                    console.log(response);
                    res.redirect(response);
                }).catch((error) => console.log(JSON.stringify(error)));
            });

            app.get('/redirect', (req, res) => {
                const tokenRequest = {
                    code: req.query.code,
                    redirectUri: "http://localhost:3000/redirect",
                    scopes: ["openid"],
                };

                pca.acquireTokenByCode(tokenRequest).then((response) => {
                    console.log("\nResponse: \n", response);
                    res.sendStatus(200);
                    return msalCacheManager.writeToPersistence();
                }).catch((error) => {
                    console.log(error);
                    res.status(500).send(error);
                });
            });

            msalCacheManager.readFromPersistence().then(() => {
                app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
            });
        }
    );



