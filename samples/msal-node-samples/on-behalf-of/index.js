/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const session = require("express-session")
const msal = require("@azure/msal-node");
const http = require("http");
const https = require('https');
const jwt = require("jsonwebtoken")
const jwksClient = require("jwks-rsa");

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");

const TEST_CACHE_LOCATION = argv.c || "./data/cache.json";
const cachePlugin = require("../cachePlugin")(TEST_CACHE_LOCATION);

const webAppConfig = require("./config/WEB-APP.json");
const webApiConfig = require("./config/WEB-API.json");

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
            accessToken = response.accessToken;
            callWebApi(response.accessToken, (oboResponse) => {
                res.status(200).send(oboResponse);
            });
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });
    
    app.get("/oboCall", (req, res) => {
        callWebApi(accessToken, (oboResponse) => {
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
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
                callback(chunk);
            });
        });
        req.on("error", (err) => {
            console.log(err);
        });
        req.end();
    }
    
    return app.listen(webAppPort, () => console.log(`Msal Node web app listening on port ${webAppPort}!`))
};

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

            jwt.verify(token, getSigningKeys, validationOptions, (err, payload) => {
                if (err) {
                    console.log(err);
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

        client.getSigningKey(header.kid, function (err, key) {
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
            console.log(error);
            res.status(500).send(error);
        });
    });

    const callGraph = (accessToken, callback) => {
        const options = {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            }
        };

        const req = https.request(new URL("https://graph.microsoft.com/v1.0/me"), options, (res) => {
            res.setEncoding("utf8");
            res.on("data", (chunk) => {
                callback(chunk);
            });
        });
        req.on("error", (err) => {
            console.log(err);
        });
        req.end();
    }

    return app.listen(webApiPort, () => console.log(`Msal Node Web API listening on port ${webApiPort}!`))
};

if(argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    };

    const webAppConfidentialClient = new msal.ConfidentialClientApplication({auth: webAppConfig.authOptions, cache: { cachePlugin }, system: { loggerOptions }});
    const webApiConfidentialClient = new msal.ConfidentialClientApplication({auth: webApiConfig.authOptions, cache: { cachePlugin }, system: { loggerOptions }});
    acquireTokenByCode(webAppConfidentialClient, webAppConfig.serverPort, webApiConfig.serverPort, webAppConfig.redirectUri, webApiConfig.webApiUrl);
    acquireTokenObo(webApiConfidentialClient, webApiConfig.serverPort, webApiConfig.authOptions.clientId, webApiConfig.authOptions.authority, webApiConfig.discoveryKeysEndpoint);
    
    return;
}

module.exports = {
    acquireTokenByCode,
    acquireTokenObo,
};