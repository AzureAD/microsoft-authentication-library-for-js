/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require("express");
const session = require("express-session");
const msal = require("@azure/msal-node");
require("dotenv").config();

const argv = require("../cliArgs");

const SERVER_PORT = argv.p || 3000;
const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require("../cachePlugin")(cacheLocation);

const scenario = argv.s || "AAD";
const config = require(`./config/${scenario}.json`);

const getTokenMcp = function (scenarioConfig, clientApplication, port, msalTokenCache) {
    const serverPort = port || SERVER_PORT;
    const app = express();

    app.use(
        session({
            secret: process.env.SESSION_SECRET || "mcp-test-secret",
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false },
        })
    );

    const requestConfig = scenarioConfig.request;
    const cryptoProvider = new msal.CryptoProvider();

    // Home page — renders a sign-in link
    app.get("/", (req, res) => {
        if (req.query.code) {
            return res.redirect(
                `/redirect?code=${req.query.code}&state=${req.query.state}`
            );
        }
        res.send(
            `<html><body>
                <a id="SignIn" href="/login">Sign in</a>
            </body></html>`
        );
    });

    app.get("/login", async (req, res) => {
        const nonce = cryptoProvider.createNewGuid();
        const state = cryptoProvider.createNewGuid();
        req.session.nonce = nonce;
        req.session.state = state;

        const authCodeUrl = await clientApplication.getAuthCodeUrl({
            ...requestConfig.authCodeUrlParameters,
            nonce,
            state,
        });
        res.redirect(authCodeUrl);
    });

    app.get("/redirect", async (req, res) => {
        const tokenRequest = {
            ...requestConfig.tokenRequest,
            code: req.query.code,
            state: req.query.state,
        };
        const authCodeResponse = {
            nonce: req.session.nonce,
            code: req.query.code,
            state: req.session.state,
        };

        clientApplication
            .acquireTokenByCode(tokenRequest, authCodeResponse)
            .then((response) => {
                req.session.homeAccountId = response.account.homeAccountId;
                res.send(
                    `<html><body>
                        <span id="token-acquired">Token acquired</span>
                        <a id="acquireTokenSilent" href="/silent">Acquire token silently</a>
                    </body></html>`
                );
            })
            .catch((error) => {
                res.status(500).send(error.errorMessage || error.message);
            });
    });

    app.get("/silent", async (req, res) => {
        const accounts = await msalTokenCache.getAllAccounts();
        if (accounts.length === 0) {
            return res.redirect("/");
        }

        const silentRequest = {
            ...requestConfig.silentRequest,
            account: accounts[0],
            ...(req.query.resource ? { resource: req.query.resource } : {}),
        };

        clientApplication
            .acquireTokenSilent(silentRequest)
            .then(() => {
                res.send(
                    `<html><body>
                        <span id="token-acquired-silently">Token acquired silently</span>
                        <a id="acquireTokenSilent" href="/silent">Acquire token silently</a>
                    </body></html>`
                );
            })
            .catch((error) => {
                res.status(500).send(error.errorCode || error.message);
            });
    });

    return app.listen(serverPort, () =>
        console.log(`MCP Sample app listening on port ${serverPort}!`)
    );
};

if (argv.$0 === "index.js") {
    const clientConfig = {
        auth: {
            clientId: config.authOptions.clientId,
            authority: config.authOptions.authority,
            isMcp: config.authOptions.isMcp,
        },
        cache: { cachePlugin },
    };

    const publicClientApplication = new msal.PublicClientApplication(clientConfig);
    const msalTokenCache = publicClientApplication.getTokenCache();
    return getTokenMcp(config, publicClientApplication, null, msalTokenCache);
}

module.exports = getTokenMcp;
