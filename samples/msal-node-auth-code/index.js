/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require('@azure/msal-node');
const myLocalCache = require("./data/cache");
const fs = require("fs");

const SERVER_PORT = process.env.PORT || 3000;

// initialize msal public client application
const publicClientConfig = {
    auth: {
        clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority:
            "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cacheLocation: "fileCache", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
        beforeCacheAccess: (done) => {
            // get my version of stuff asyncronously and return to this
            fs.readFile("./data/cache.json", (err, data) => {
                let json;
                if (err) {
                    return done();
                }
                try {
                    json = JSON.parse(data);
                    done(json);
                } catch(e) {
                    console.error("could not read file");
                    done();
                }
            });
        },
        afterCacheAccess: (cache) => {
            // get the cache state after something happens so that the current state can be ... merged?
            console.log(cache);
            // uncomment this to show writing of cache, dont commit real tokens.
            // fs.writeFileSync("./data/cache.json", JSON.stringify(pca.readCache()), null, 4);
        }
    },
};
const pca = new msal.PublicClientApplication(publicClientConfig);
pca.initializeCache(myLocalCache);

// Create Express App and Routes
const app = express();

app.get('/',  (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: ["http://localhost:3000/redirect"],
    };

    // get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            console.log(response);
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
});

app.get('/redirect', (req, res) => {
    const tokenRequest = {
        code: req.query.code,
        redirectUri: "http://localhost:3000/redirect",
        scopes: ["user.read"],
        // codeVerifier: ""
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.send(200);
        // uncomment this to show writing of cache, dont commit real tokens.
        // fs.writeFileSync("./data/cache.json", JSON.stringify(pca.readCache()), null, 4);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`))
