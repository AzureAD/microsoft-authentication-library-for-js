/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require('@azure/msal-node');
const { promises: fs } = require("fs");

const SERVER_PORT = process.env.PORT || 3000;

// Cache Plugin Configuration
const readFromStorage = () => {
    return fs.readFile("./data/cache.json", "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then(oldFile =>{
        const mergedState = getMergedState(oldFile);
        return fs.writeFile("./data/cacheAfterWrite.json", mergedState);
    })
};

const cachePlugin = {
    readFromStorage,
    writeToStorage
};

// Public Client Application Configuration
const publicClientConfig = {
    auth: {
        clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cachePlugin
    },
};

// Acquire Token Request Configuration
const scopes = ["user.read"];

const authCodeUrlParameters = {
    scopes: scopes,
    redirectUri: ["http://localhost:3000/redirect"],
};

const pca = new msal.PublicClientApplication(publicClientConfig);
const msalCacheManager = pca.getCacheManager();
let accounts;

// Create Express App and Routes
const app = express();


app.get('/', (req, res) => {

    // get Accounts
    accounts = msalCacheManager.getAllAccounts();
    console.log("Accounts: ", accounts);

    // Build silent request
    const silentRequest = {
        account: accounts[1],
        scopes: scopes,
    };

    // Acquire Token Silent Request
    console.log("Attempting silent token acquisition.");
    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            // Successful silent request
            console.log("\nSuccessful silent token acquisition:\nResponse: \n:", response);
            res.sendStatus(200);
            return msalCacheManager.writeToPersistence();
        })
        .catch((error) => {
            // No access tokens in cache
            if(error.errorCode === "no_tokens_found") {
                console.log("No tokens in cache, falling back to auth code.");
                // get url to sign user in and consent to scopes needed for application
                pca.getAuthCodeUrl(authCodeUrlParameters)
                    .then((response) => {
                        console.log(response);
                        res.redirect(response);
                })
                .catch((error) => console.log(JSON.stringify(error)));
            } else {
                // Other errors
                console.log(error);
                res.status(500).send(error);
            }
        });
});

// Second leg of Auth Code grant
app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        redirectUri: "http://localhost:3000/redirect",
        scopes: scopes,
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.sendStatus(200);
        return msalCacheManager.writeToPersistence();
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

msalCacheManager.readFromPersistence().then(() => {
    app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
});

