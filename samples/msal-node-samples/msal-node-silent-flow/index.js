/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const handlebars = require('express-handlebars');
const msal = require('@azure/msal-node');
const { promises: fs } = require("fs");
const axios = require("axios");

const SERVER_PORT = process.env.PORT || 3000;

/**
 * Cache Plugin configuration
 */
const cachePath = "./data/example.cache.json"; // Replace this string with the path to your valid cache file.

const readFromStorage = () => {
    return fs.readFile(cachePath, "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then(oldFile =>{
        const mergedState = getMergedState(oldFile);
        return fs.writeFile(cachePath, mergedState);
    })
};

const cachePlugin = {
    readFromStorage,
    writeToStorage
};

/**
 * Public Client Application Configuration
 */
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

/** Request Configuration */

const scopes = ["user.read"];

const authCodeUrlParameters = {
    scopes: scopes,
    redirectUri: ["http://localhost:3000/redirect"],
};

const pca = new msal.PublicClientApplication(publicClientConfig);
const msalCacheManager = pca.getCacheManager();
let accounts;

/**
 * Express App
 */
const app = express();

// Set handlebars view engine
app.engine(
    "hbs",
    handlebars({
        layoutsDir: __dirname + "/views",
        extname: "hbs",
    })
);

/** 
 * App Routes
 */
app.get('/', (req, res) => {
    const data = {
        showSignInButton: true
    }

    res.render("main.hbs", data);
});

// Initiates Auth Code Grant
app.get('/login', (req, res) => {
    pca.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            console.log(response);
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
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
        const templateParams = { showLoginButton: false, showATSButton: true, username: response.account.username};
        res.render("main.hbs", templateParams);
        return msalCacheManager.writeToPersistence();
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

// Initiates Acquire Token Silent flow
app.get('/silentFlow', (req, res) => {
    // get Accounts
    accounts = msalCacheManager.getAllAccounts();
    console.log("Accounts: ", accounts);

    // Build silent request
    const silentRequest = {
        account: accounts[1], // Index must match the account that is trying to acquire token silently
        scopes: scopes,
    };

    let templateParams = { showLoginButton: false,
                           acquiredToken: null,
                           couldNotAcquireToken: null,
                           username: null };

    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            // Successful silent request
            templateParams.acquiredToken = true;
            templateParams.username = response.account.username;
            accessToken = response.accessToken;
            console.log("\nSuccessful silent token acquisition:\nResponse: \n:", response);
            res.render("main.hbs", templateParams)
            return msalCacheManager.writeToPersistence();
        })
        .catch((error) => {
            console.log(error);
            templateParams.couldNotAcquireToken = true;
            res.render("main.hbs", templateParams)
        });
});

// Calls MS Graph with access token
app.get('/me', (req, res) => {
    const silentRequest = {
        account: accounts[1], // Index must match the account that is trying to acquire token silently
        scopes: scopes,
    };

    pca.acquireTokenSilent(silentRequest)
        .then(response => {
            axios.default.get("https://graph.microsoft.com/v1.0/me", {
                headers: {
                    Authorization: `Bearer ${response.accessToken}`
                }
            })
                .then(response => {
                    res.json(response.data);
                })
                .catch(error => {
                    res.status(500).send(error);
                })
        });
})

msalCacheManager.readFromPersistence().then(() => {
    app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
});

