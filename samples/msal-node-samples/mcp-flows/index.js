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

const LAYOUT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
  <title>Quickstart | MSAL Node.js Sample</title>
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" integrity="sha384-Vkoo8x4CGsO3+Hhxv8T/Q5PaXtkKtu6ug5TOeNV6gBiFeWPGFN9MuhOf23Q9Ifjh" crossorigin="anonymous">
  <link rel="SHORTCUT ICON" href="https://c.s-microsoft.com/favicon.ico?v2" type="image/x-icon">
</head>
<body>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <a class="navbar-brand" href="/">MS Identity Platform</a>
    SIGNIN_BUTTON
  </nav>
  <br>
  <h5 class="card-header text-center">MSAL Node.js demonstrating MCP Flow</h5>
  <br>
  <div class="row" style="margin:auto">
    BODY
  </div>
</body>
</html>`;

function renderLogin() {
    return LAYOUT
        .replace("SIGNIN_BUTTON", `<div class="ml-auto"><a type="button" id="SignIn" class="btn btn-secondary" href="/login">Sign In</a></div>`)
        .replace("BODY", `<div id="card-div" class="col-md-3"><div class="card text-center"><div class="card-body"><h5 class="card-title">Please sign-in to acquire a token</h5></div></div></div>`);
}

function renderAuthenticated(username, options = {}) {
    const silentSpan = options.acquiredTokenSilently ? `<pre id="token-acquired-silently">Silent token acquisition successful</pre>` : "";
    const tokenSpan = options.tokenAcquired ? `<span id="token-acquired">Token acquired successfully</span>` : "";
    return LAYOUT
        .replace("SIGNIN_BUTTON", "")
        .replace("BODY", `
          <div id="card-div" class="col-md-3"><div class="card text-center"><div class="card-body">
            <h5 class="card-title">Welcome, ${username}!</h5>
            <a class="btn btn-primary" href="/silent" id="acquireTokenSilent">Acquire Token Silently</a>
          </div></div></div>
          <div class="col-md-5"><div class="tab-content">${tokenSpan}${silentSpan}</div></div>`);
}

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

    app.get("/", (req, res) => {
        if (req.query.code) {
            return res.redirect(
                `/redirect?code=${req.query.code}&state=${req.query.state}`
            );
        }
        if (req.session.username) {
            const tokenJustAcquired = req.session.tokenJustAcquired || false;
            req.session.tokenJustAcquired = false;
            return res.send(renderAuthenticated(req.session.username, { tokenAcquired: tokenJustAcquired }));
        }
        res.send(renderLogin());
    });

    app.get("/login", async (req, res) => {
        const nonce = cryptoProvider.createNewGuid();
        const state = cryptoProvider.createNewGuid();
        req.session.nonce = nonce;
        req.session.state = state;

        const authCodeUrl = await clientApplication.getAuthCodeUrl({
            ...requestConfig.authCodeUrlParameters,
            resource: requestConfig.tokenRequest.resource,
            nonce,
            state,
        });
        res.redirect(authCodeUrl);
    });

    app.get("/redirect", async (req, res) => {
        const tokenRequest = {
            ...requestConfig.tokenRequest,
            code: req.query.code,
            nonce: req.session.nonce,
            state: req.query.state,
        };
        const authCodeResponse = {
            code: req.query.code,
            state: req.session.state,
        };

        clientApplication
            .acquireTokenByCode(tokenRequest, authCodeResponse)
            .then((response) => {
                req.session.homeAccountId = response.account.homeAccountId;
                req.session.username = response.account.username;
                req.session.tokenJustAcquired = true;
                res.redirect("/");
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
            .then((response) => {
                res.send(renderAuthenticated(response.account.username, { acquiredTokenSilently: true }));
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
