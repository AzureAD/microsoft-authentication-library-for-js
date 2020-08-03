/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require('express-handlebars');
const msal = require('@azure/msal-node');

// AAD variables
const aadConfig = require('./AAD/authConfig');
const aadRequest = require('./AAD/request');
const aadApiConfig = require('./AAD/apiConfig');
const graph = require("./AAD/graph");

// B2C variables
const b2cConfig = require('./B2C/authConfig');
const b2cRequest = require('./B2C/request');
const b2cApiConfig = require('./B2C/apiConfig');
const b2cAPI = require('./B2C/api');

const SERVER_PORT = process.env.PORT || 3000;
// const tenantType = "AAD";
const tenantType = "B2C";

/**
 * Public Client Application
 */
const config = (tenantType === "AAD") ? aadConfig : b2cConfig;
const request = (tenantType === "AAD") ? aadRequest : b2cRequest;

const pca = new msal.PublicClientApplication(config);
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
app.get('/login', async(req, res) => {
    try {
        response = await pca.getAuthCodeUrl(request.authCodeUrlParameters);
        console.log("successful auth url acquisition"); // console.log(response);
        res.redirect(response);
    }
    catch (error) {
        console.log(JSON.stringify(error));
    }
});

// Second leg of Auth Code grant
app.get('/redirect', async(req, res) => {
    request.tokenRequest.code = req.query.code;
    try {
        response = await pca.acquireTokenByCode(request.tokenRequest);
        console.log("Successful auth-code token acquisition"); // console.log("\nResponse: \n:", response);
        const templateParams = { showLoginButton: false, username: response.account.username, profile: false};
        res.render("graph", templateParams);
        return msalTokenCache.writeToPersistence();
    } catch(error) {
        console.log(error);
        res.status(500).send(error);
    }
});

// Initiates Acquire Token Silent flow
app.get('/graphCall', async(req, res) => {
    // get Accounts
    accounts = msalTokenCache.getAllAccounts();
    console.log("Accounts: ", accounts);

    const currentAccount = (tenantType === "AAD") ? accounts[1] : accounts[2];
    request.silentRequest.account = currentAccount;

    let templateParams = { showLoginButton: false };
    // Acquire Token Silently to be used in MS Graph call
    try {
        response = await pca.acquireTokenSilent(request.silentRequest);

        console.log("\nSuccessful silent token acquisition\n"); // console.log("Response: \n:", response);
        const username = response.account.username;

        if (tenantType === "AAD") {
            // Call graph after successfully acquiring token
            graph.callMSGraph(aadApiConfig.graphConfig.graphMeEndpoint, response.accessToken, (response, endpoint) => {
                templateParams = {
                    ...templateParams,
                    username,
                    profile: JSON.stringify(response, null, 4)
                };
                res.render("graph", templateParams);
                return msalTokenCache.writeToPersistence();
            });
        } else {
            // call B2C endpoint with the token
            b2cAPI.callApiWithAccessToken(b2cApiConfig.b2cApiConfig.webApi, response.accessToken, (response, endpoint) => {
                templateParams = {
                    ...templateParams,
                    username,
                    profile: JSON.stringify(response, null, 4)
                };
                res.render("webApi", templateParams);
                return msalTokenCache.writeToPersistence();
            });
        }

    }
    catch(error) {
            console.log(error);
            templateParams.couldNotAcquireToken = true;
            res.render("graph", templateParams)
    }
});

msalTokenCache.readFromPersistence().then(() => {
    app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
});

