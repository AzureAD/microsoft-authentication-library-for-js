/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require('express-handlebars');
const { promises: fs } = require("fs");

const graph = require('./graph');

const graphConfig = {
    graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me'
};

const requestConfig = require('./requestConfig');

function configureExpressApp(app) {
    // Set handlebars view engine
    app.engine('.hbs', exphbs({extname: '.hbs'}));
    app.set('view engine', '.hbs');
}

function handleAuthorizationResponse(res, authResponse, templateParams, msalTokenCache) {
    console.log("\nSuccessful silent token acquisition:\nResponse: \n:", authResponse);
    const username = authResponse.account.username;
    // Call graph after successfully acquiring token
    graph.callMSGraph(graphConfig.graphMeEndpoint, authResponse.accessToken, (authResponse, endpoint) => {
        // Successful silent request
        templateParams = {
            ...templateParams,
            username,
            profile: JSON.stringify(authResponse, null, 4)
        };
        res.render("graph", templateParams);
        return msalTokenCache.writeToPersistence();
    });
}

module.exports = function(app, clientApplication, msalTokenCache)  {
    configureExpressApp(app);
    /**
     * App Routes
     */
    app.get('/', (req, res) => {
        res.render("login", { showSignInButton: true});
    });
    
    // Initiates Auth Code Grant
    app.get('/login', (req, res) => {
        clientApplication.getAuthCodeUrl(requestConfig)
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
            scopes: requestConfig.scopes,
        };
    
        clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
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
        const accounts = msalTokenCache.getAllAccounts();
        console.log("Accounts: ", accounts);
    
        // Build silent request
        const silentRequest = {
            /** 
             * Index must match the account's position in the cache. The sample cache file contains a dummy account
             * entry in index 0, hence the actual account that is logged in will be index 1
             */
            account: accounts[1], 
            scopes: requestConfig.scopes,
        };
    
        let templateParams = { showLoginButton: false };
        // Acquire Token Silently to be used in MS Graph call
        clientApplication.acquireTokenSilent(silentRequest)
            .then((authResponse) => {
                return handleAuthorizationResponse(res, authResponse, templateParams, msalTokenCache);
            })
            .catch((error) => {
                console.log(error);
                templateParams.couldNotAcquireToken = true;
                res.render("graph", templateParams)
            });
    });    
};
