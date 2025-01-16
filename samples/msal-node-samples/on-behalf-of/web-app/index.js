
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require("@azure/msal-node");
const http = require("http");

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../../cliArgs");

const WEB_APP_TEST_CACHE_LOCATION = argv.c || "../data/webAppCache.json";
const webAppCachePlugin = require("../../cachePlugin")(WEB_APP_TEST_CACHE_LOCATION);

const webAppConfig = require("../config/WEB-APP.json");
const webApiConfig = require("../config/WEB-API.json");

const acquireTokenByCode = (cca, webAppPort, webApiPort, redirectUri, webApiScope) => {
    const app = express();

    let accessToken = null;

    app.get("/", (req, res) => {
        const authCodeUrlParameters = {
            scopes: [webApiScope],
            redirectUri: redirectUri,
        };

        // get url to sign user in and consent to scopes needed for application
        cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        });
    });

    app.get("/redirect", (req, res) => {
        const tokenRequest = {
            code: req.query.code,
            scopes: [webApiScope],
            redirectUri: redirectUri,
        };

        cca.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("Response received. Calling web API");
            accessToken = response.accessToken;
            callWebApi(response.accessToken, (oboResponse) => {
                res.status(200).send(oboResponse);
            });
        }).catch((error) => {
            res.status(500).send(error.errorMessage);
        });
    });

    app.get("/oboCall", (req, res) => {
        callWebApi(accessToken, () => {
            res.sendStatus(200);
        });
    });

    const callWebApi = (accessToken, callback) => {
        const options = {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        };

        const req = http.request(new URL(`http://localhost:${webApiPort}/obo`), options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
                callback(chunk);
            });
        });
        req.on("error", (error) => {
            console.error(error.errorMessage);
        });
        req.end();
    };

    return app.listen(webAppPort, () => console.log(`Msal Node web app listening on port ${webAppPort}!`));
};

if(argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Info,
    };
    const webAppCCA = new msal.ConfidentialClientApplication({auth: webAppConfig.authOptions, system: { loggerOptions }, cache: { cachePlugin: webAppCachePlugin }});
    acquireTokenByCode(webAppCCA, webAppConfig.serverPort, webApiConfig.serverPort, webAppConfig.redirectUri, webApiConfig.webApiScope);
}

module.exports = {
    acquireTokenByCode,
};
