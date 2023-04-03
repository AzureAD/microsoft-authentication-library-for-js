
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const msal = require("@azure/msal-node");
const http = require("http");

const webAppConfig = require("../config/WEB-APP.json");
const webApiConfig = require("../config/WEB-API.json");

const acquireTokenByCode = (cca, webAppPort, webApiPort, redirectUri, webApiUrl) => {
    const app = express();

    let accessToken = null;

    app.get("/", (req, res) => {
        const authCodeUrlParameters = {
            scopes: [webApiUrl],
            redirectUri: redirectUri,
        };

        // get url to sign user in and consent to scopes needed for application
        cca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => {
            console.log(JSON.stringify(error))
        });
    });

    app.get("/redirect", (req, res) => {
        const tokenRequest = {
            code: req.query.code,
            scopes: [webApiUrl],
            redirectUri: redirectUri,
        };

        cca.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("Response received. Calling web API");
            accessToken = response.accessToken;
            callWebApi(response.accessToken, (oboResponse) => {
                console.log(oboResponse);
                res.status(200).send(oboResponse);
            });
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });

    app.get("/oboCall", (req, res) => {
        callWebApi(accessToken, (oboResponse) => {
            console.log(oboResponse);
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
        req.on("error", (err) => {
            console.log(err);
        });
        req.end();
    };

    return app.listen(webAppPort, () => console.log(`Msal Node web app listening on port ${webAppPort}!`));
};

const loggerOptions = {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: msal.LogLevel.Verbose,
};
const webAppCCA = new msal.ConfidentialClientApplication({auth: webAppConfig.authOptions, system: { loggerOptions }});
acquireTokenByCode(webAppCCA, webAppConfig.serverPort, webApiConfig.serverPort, webAppConfig.redirectUri, webApiConfig.webApiUrl);

module.exports = {
    acquireTokenByCode,
};
