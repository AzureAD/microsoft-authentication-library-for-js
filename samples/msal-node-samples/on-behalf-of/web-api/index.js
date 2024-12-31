/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const https = require("https");
const msal = require("@azure/msal-node");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../../cliArgs");

const WEB_API_TEST_CACHE_LOCATION = argv.c || "../data/webApiCache.json";
const webApiCachePlugin = require("../../cachePlugin")(WEB_API_TEST_CACHE_LOCATION);

const webApiConfig = require("../config/WEB-API.json");

const acquireTokenObo = (cca, webApiPort, clientId, authority, discoveryKeysEndpoint) => {
    const app = express();

    const validateJwt = (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(" ")[1];
            
            const validationOptions = {
                audience: clientId, // v2.0 token
                issuer: `${authority}/v2.0`, // v2.0 token
            };

            jwt.verify(token, getSigningKeys, validationOptions, (error, payload) => {
                if (error) {
                    console.error(error);
                    return res.sendStatus(403);
                }

                next();
            });
        } else {
            res.sendStatus(401);
        }
    };

    const getSigningKeys = (header, callback) => {
        var client = jwksClient({
            jwksUri: discoveryKeysEndpoint,
        });

        client.getSigningKey(header.kid, function (error, key) {
            var signingKey = key.publicKey || key.rsaPublicKey;
            callback(null, signingKey);
        });
    }

    app.get("/obo", validateJwt, (req, res) => {
        const authHeader = req.headers.authorization;

        const oboRequest = {
            oboAssertion: authHeader.split(" ")[1],
            scopes: ["user.read"],
        };

        cca.acquireTokenOnBehalfOf(oboRequest).then((response) => {
            callGraph(response.accessToken, (graphResponse) => {
                res.status(200).send(graphResponse);
            });
        }).catch((error) => {
            res.status(500).send(error.errorMessage);
        });
    });

    const callGraph = (accessToken, callback) => {
        const options = {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        };

        const req = https.request(new URL("https://graph.microsoft.com/v1.0/me"), options, (res) => {
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
                callback(chunk);
            });
        });
        req.on("error", (error) => {
            console.error(error.errorMessage);
        });
        req.end();
    }

    return app.listen(webApiPort, () => console.log(`Msal Node Web API listening on port ${webApiPort}!`));
};

if(argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Info,
    };
    const webApiCCA = new msal.ConfidentialClientApplication({auth: webApiConfig.authOptions, system: { loggerOptions }, cache: { cachePlugin: webApiCachePlugin}});
    acquireTokenObo(webApiCCA, webApiConfig.serverPort, webApiConfig.authOptions.clientId, webApiConfig.authOptions.authority, webApiConfig.discoveryKeysEndpoint);
}

module.exports = {
    acquireTokenObo,
};
