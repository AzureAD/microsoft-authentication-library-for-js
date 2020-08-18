/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require("express-handlebars");
const msal = require("@azure/msal-node");
const { promises: fs } = require("fs");

const graph = require("./AAD/graph");
const graphAPI = require("./configuration/graphApiConfig.json");
const b2cAPI = require("./configuration/b2cApiConfig.json");
// const config = require("./configuration/aadConfig.json");
const config = require("./configuration/b2cConfig.json");
const SERVER_PORT = process.env.PORT || 3000;

/**
 * Cache Plugin configuration
 */
const cachePath = "./data/example.cache.json"; // Replace this string with the path to your valid cache file.

const readFromStorage = () => {
    return fs.readFile(cachePath, "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then((oldFile) => {
        const mergedState = getMergedState(oldFile);
        return fs.writeFile(cachePath, mergedState);
    });
};

const cachePlugin = {
    readFromStorage,
    writeToStorage,
};

// const tenantType = "AAD";
const tenantType = "B2C";

/**
 * Public Client Application
 */
config.msalConfig.cache = { cachePlugin };

const pca = new msal.PublicClientApplication(config.msalConfig);
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
        response = await pca.getAuthCodeUrl(config.authCodeUrlParameters);
        console.log("successful auth url acquisition"); // console.log(response);
        res.redirect(response);
    }
    catch (error) {
        console.log(JSON.stringify(error));
    }
});

// Second leg of Auth Code grant
app.get('/redirect', async (req, res) => {
    config.tokenRequest.code = req.query.code;
    try {
        response = await pca.acquireTokenByCode(config.tokenRequest);
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
    config.silentRequest.account = currentAccount;

    let templateParams = { showLoginButton: false };
    // Acquire Token Silently to be used in MS Graph call
    try {
        response = await pca.acquireTokenSilent(config.silentRequest);

        console.log("\nSuccessful silent token acquisition\n"); // console.log("Response: \n:", response);
        const username = response.account.username;

        if (tenantType === "AAD") {
            // Call graph after successfully acquiring token
            graph.callMSGraph(graphAPI.graphConfig.graphMeEndpoint, response.accessToken, (response, endpoint) => {
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
            b2cAPI.callApiWithAccessToken(b2cAPI.b2cApiConfig.webApi, response.accessToken, (response, endpoint) => {
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

