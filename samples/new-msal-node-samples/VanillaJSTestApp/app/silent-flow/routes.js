/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require('express-handlebars');

const RESOURCE_API_PATH = './resourceApi';

function configureExpressApp(app) {
    // Set handlebars view engine
    app.engine('.hbs', exphbs({extname: '.hbs'}));
    app.set('view engine', '.hbs');
}

function handleAuthorizationResponse(res, authResponse, templateParams, msalTokenCache, authorityType) {
    // Get authority-specific resource API
    const resourceApi = require(RESOURCE_API_PATH)(authorityType);

    console.log("\nSuccessful silent token acquisition:\nResponse: \n:", authResponse);
    const username = authResponse.account.username;
    // Call graph after successfully acquiring token
    resourceApi.call(authResponse.accessToken, (authResponse, endpoint) => {
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

module.exports = function(app, clientApplication, msalTokenCache, authorityType)  {
    configureExpressApp(app);
    const requestConfig = require(`./${authorityType}/requestConfig.json`);
    /**
     * App Routes
     */
    app.get('/', (req, res) => {
        res.render("login", { showSignInButton: true});
    });
    
    // Initiates Auth Code Grant
    app.get('/login', (req, res) => {
        clientApplication.getAuthCodeUrl(requestConfig.authCodeUrlParameters)
            .then((response) => {
                console.log(response);
                res.redirect(response);
            })
            .catch((error) => console.log(JSON.stringify(error)));
    });
    
    // Second leg of Auth Code grant
    app.get('/redirect', (req, res) => {
        const tokenRequest = { ...requestConfig.tokenRequest, code: req.query.code };
    
        clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
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

        /** 
         * Account index must match the account's position in the cache. The sample cache file contains a dummy account
         * entry in index 0, hence the actual account that is logged in will be index 1
         */
        const silentRequest = { ...requestConfig.silentRequest, account: accounts[1] };
    
        let templateParams = { showLoginButton: false };
        // Acquire Token Silently to be used in MS Graph call
        clientApplication.acquireTokenSilent(silentRequest)
            .then((authResponse) => {
                return handleAuthorizationResponse(res, authResponse, templateParams, msalTokenCache, authorityType);
            })
            .catch((error) => {
                console.log(error);
                templateParams.couldNotAcquireToken = true;
                res.render("graph", templateParams)
            });
    });    
};
