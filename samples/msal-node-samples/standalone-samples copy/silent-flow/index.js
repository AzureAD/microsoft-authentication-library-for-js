/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require("express-handlebars");
const msal = require("@azure/msal-node");
const fs = require("fs");

const graph = require("./graph");

const SERVER_PORT = process.env.PORT || 3000;

/**
 * Cache Plugin configuration
 */
const cachePath = "./data/example.cache.json"; // Replace this string with the path to your valid cache file.

const beforeCacheAccess = async (cacheContext) => {
    return new Promise(async (resolve, reject) => {
        if (fs.existsSync(cachePath)) {
            fs.readFile(cachePath, "utf-8", (err, data) => {
                if (err) {
                    reject();
                } else {
                    console.log(data);
                    cacheContext.tokenCache.deserialize(data);
                    resolve();
                }
            });
        } else {
           fs.writeFile(cachePath, cacheContext.tokenCache.serialize(), (err) => {
                if (err) {
                    reject();
                }
            });
        }
    });
};

const afterCacheAccess = async (cacheContext) => {
    if(cacheContext.cacheHasChanged){
        await fs.writeFile(cachePath, cacheContext.tokenCache.serialize(), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
};

const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess
};

const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me"
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

/**
 * Express App
 */
const app = express();

// Set handlebars view engine
app.engine(".hbs", exphbs({ extname: ".hbs" }));
app.set("view engine", ".hbs");

// Initialize homeAccountId in memory
app.locals.homeAccountId = null;

/**
 * App Routes
 */
app.get("/", (req, res) => {
    res.render("login", { showSignInButton: true });
});

// Initiates Auth Code Grant
app.get("/login", (req, res) => {
    pca.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            console.log(response);
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
});

// Second leg of Auth Code grant
app.get("/redirect", (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        redirectUri: "http://localhost:3000/redirect",
        scopes: scopes,
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        // Home account ID from token response account is used here to find the same account from the cache
        app.locals.homeAccountId = response.account.homeAccountId;
        const templateParams = { showLoginButton: false, username: response.account.username, profile: false };
        res.render("graph", templateParams);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

// Initiates Acquire Token Silent flow
app.get("/graphCall", async (req, res) => {
    // Find account using homeAccountId built after receiving token response
    const account = await msalTokenCache.getAccountByHomeId(app.locals.homeAccountId);

    // Build silent request
    const silentRequest = {
        account: account,
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
            });
        })
        .catch((error) => {
            console.log(error);
            templateParams.couldNotAcquireToken = true;
            res.render("graph", templateParams);
        });
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
