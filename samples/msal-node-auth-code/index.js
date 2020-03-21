/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

//initialize express
const express = require("express");
const app = express();
const port = 3000;
app.get('/', (req, res) => redirectToAzureAd(req, res));
app.get('/redirect', (req, res) =>  acquireToken(req, res));

// initialize msal public client application
let msal = require('@azure/msal-node');
const publicClientConfig = {
    auth: {
        clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority:
            "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cacheLocation: "fileCache", // This configures where your cache will be stored
        storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
    }
};

const pca = new msal.PublicClientApplication(publicClientConfig);

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

function redirectToAzureAd(req, res){

    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: ["http://localhost:3000/redirect"],
    };

    pca.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            console.log(response);
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
}

function acquireToken(req, res){
    const tokenRequest = {
        code: req.query.code,
        redirectUri: "http://localhost:3000/redirect",
        scopes: ["user.read"],
        // codeVerifier: ""
    };

    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log(JSON.stringify(response));
        res.send(200);
    }).catch((error) => {
        console.log(JSON.stringify(error.response));
    })
}
