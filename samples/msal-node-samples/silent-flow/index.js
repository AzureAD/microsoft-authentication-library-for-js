/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require('express-handlebars');
const msal = require('@azure/msal-node');
const { promises: fs } = require("fs");

const graph = require('./graph');

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


const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me'
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
    redirectUri: "http://localhost:3000/redirect",
};

const pca = new msal.PublicClientApplication(publicClientConfig);
const msalTokenCache = pca.getTokenCache();
let accounts;

/**
 * Express App
 */
const app = express();

// Set handlebars view engine
app.engine('.hbs', exphbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

/**
 * App Routes
 */
app.get('/', (req, res) => {
    res.render("login", { showSignInButton: true});
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
        const templateParams = { showLoginButton: false, username: response.account.username, profile: false};
        res.render("graph", templateParams);
        return msalTokenCache.writeToPersistence();
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

// Initiates Acquire Token Silent flow
app.get('/graphCall', (req, res) => {
    // get Accounts
    accounts = msalTokenCache.getAllAccounts();
    console.log("Accounts: ", accounts);

    // Build silent request
    const silentRequest = {
        account: accounts[1], // Index must match the account that is trying to acquire token silently
        scopes: scopes,
    };

    let templateParams = { showLoginButton: false };
    // Acquire Token Silently to be used in MS Graph call
    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            console.log("\nSuccessful silent token acquisition:\nResponse: \n:", response);
            const username = response.account.username;
            // Call graph after successfully acquiring token
            graph.callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, (response, endpoint) => {
                // Successful silent request
                templateParams = {
                    ...templateParams,
                    username,
                    profile: JSON.stringify(response, null, 4)
                };
                res.render("graph", templateParams);
                return msalTokenCache.writeToPersistence();
            });
        })
        .catch((error) => {
            console.log(error);
            templateParams.couldNotAcquireToken = true;
            res.render("graph", templateParams)
        });
});

msalTokenCache.readFromPersistence().then(() => {
    app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
});

