/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const session = require("express-session");
const exphbs = require("express-handlebars");
const msal = require("@azure/msal-node");
const path = require("path");
const url = require("url");
require("dotenv").config();

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");

const RESOURCE_API_PATH = "./resourceApi";
const SERVER_PORT = argv.p || 3000;
const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require("../cachePlugin")(cacheLocation);

/**
 * The scenario string is the name of a .json file which contains the MSAL client configuration
 * For an example of what a configuration file should look like, check out the customConfig.json file in the
 * /config directory.
 *
 * You can create your own configuration file and replace the path inside the "config" require statement below
 * with the path to your custom configuraiton.
 */
const scenario = argv.s || "customConfig";
const config = require(`./config/${scenario}.json`);

const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    },
};

/**
 * This method sets the view engine and view directory
 * in which the express-handlebars views are located for
 * the application's user interface. It also sets the
 * express router on the app.
 */
function configureExpressApp(app, router) {
    // Set handlebars view engine
    app.engine(".hbs", exphbs({ extname: ".hbs" }));
    app.set("view engine", ".hbs");
    app.set("views", path.join(__dirname, "/views"));
    app.use(router);
}

/**
 * This method receives the MSAL AuthenticationResult and the scenario configuration,
 * using them to make an authorized request to the configured resource API endpoint.
 * Once the response from the API is received, this method renders the authenticated
 * view with the data from the requested resource in the template parameters.
 */
function callResourceApi(res, authResponse, templateParams, scenarioConfig) {
    // Get scenario specific resource API
    const resourceApi = require(RESOURCE_API_PATH)(scenarioConfig.resourceApi);
    const username = authResponse.account.username;

    // Call graph after successfully acquiring token
    resourceApi.call(authResponse.accessToken, (authResponse, endpoint) => {
        // Successful silent request
        templateParams = {
            ...templateParams,
            username,
            profile: JSON.stringify(authResponse, null, 4),
        };
        res.render("authenticated", templateParams);
    });
}

/**
 * The method below contains the sample application code for MSAL Node's Silent Flow
 *
 * This application consists of a set of HTTP routes that each control a different piece of the application logic.
 *
 * This application's main route is the "silentLogin" route, which is the one that calls MSAL Node's acquireTokenSilent API.
 *
 * The rest of the applicaiton logic is included for the following reasons:
 *
 *  1. To perform initial Authorization Code authentication in order to have an access token in the cache,
 *     thus enabling the Silent Flow scenario.
 *  2. To show the usage pattern in which a Node application acquires a token silently from the cache (without user interaction)
 *     and uses said access token to authenticate against a resource API (such as MS Graph).
 */
const getTokenSilent = function (
    scenarioConfig,
    clientApplication,
    port,
    msalTokenCache
) {
    // Initialize express application object
    const app = express();
    // Initialize express router
    const router = require("express-promise-router")();
    app.use(session(sessionConfig));
    configureExpressApp(app, router);

    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;

    // Extract token request configuration from the scenarioConfig object passed in
    const requestConfig = scenarioConfig.request;

    /**
     * App Routes
     */

    // Home Route
    router.get("/", (req, res) => {
        // if redirectUri is set to the main route "/", redirect to "/redirect" route for handling authZ code
        if (req.query.code)
            return res.redirect(
                url.format({ pathname: "/redirect", query: req.query })
            );

        res.render("login", { showSignInButton: true });
    });

    // This route performs interactive login to acquire and cache an Access Token/ID Token
    router.get("/login", (req, res) => {
        const cryptoProvider = new msal.CryptoProvider();
        const authCodeUrlParameters = {
            ...requestConfig.authCodeUrlParameters,
            state: cryptoProvider.createNewGuid(),
            nonce: cryptoProvider.createNewGuid(),
        };

        req.session.state = authCodeUrlParameters.state;
        req.session.nonce = authCodeUrlParameters.nonce;

        clientApplication
            .getAuthCodeUrl(authCodeUrlParameters)
            .then((response) => {
                res.redirect(response);
            });
    });

    /**
     * Silent Login route
     *
     * This route attempts to login a user silently by checking
     * the persisted cache for accounts.
     */
    router.get("/silentAcquireToken", async (req, res) => {
        if (!req.session.homeAccountId) {
            return res.status(401).render("login", {
                failedSilentLogin: true,
                showSignInButton: true,
            });
        }

        const account = await msalTokenCache.getAccountByHomeId(
            req.session.homeAccountId
        );

        if (account) {
            // Build silent token request
            const silentRequest = {
                ...requestConfig.silentRequest,
                account: account,
            };

            let templateParams = { showLoginButton: false };

            /**
             * MSAL Usage
             * The code below demonstrates the correct usage pattern of the ClientApplicaiton.acquireTokenSilent API.
             *
             * In this code block, the application uses MSAL to obtain an Access Token from the MSAL Cache. If successful,
             * the response contains an `accessToken` property. Said property contains a string representing an encoded Json Web Token
             * which can be added to the `Authorization` header in a protected resource request to demonstrate authorization.
             */
            clientApplication
                .acquireTokenSilent(silentRequest)
                .then((authResponse) => {
                    templateParams.acquiredTokenSilently = true;
                    res.render("authenticated", templateParams);
                })
                .catch((error) => {
                    templateParams.couldNotAcquireToken = true;
                    res.render("authenticated", templateParams);
                });
        } else {
            // If there are no cached accounts, render the login page
            res.render("login", {
                failedSilentLogin: true,
                showSignInButton: true,
            });
        }
    });

    // Second leg of Auth Code grant
    router.get("/redirect", (req, res) => {
        const expectedState = req.session.state;
        const expectedNonce = req.session.nonce;

        delete req.session.state;
        delete req.session.nonce;

        if (
            !req.query.code ||
            !expectedState ||
            req.query.state !== expectedState
        ) {
            return res.status(400).send("Invalid authorization response.");
        }

        const tokenRequest = {
            ...requestConfig.tokenRequest,
            code: req.query.code,
            nonce: expectedNonce,
            state: expectedState,
        };
        const authCodeResponse = {
            code: req.query.code,
            state: req.query.state,
        };
        clientApplication
            .acquireTokenByCode(tokenRequest, authCodeResponse)
            .then((response) => {
                req.session.regenerate((sessionError) => {
                    if (sessionError) {
                        return res.status(500).send(sessionError);
                    }

                    req.session.homeAccountId = response.account.homeAccountId;
                    req.session.save((saveError) => {
                        if (saveError) {
                            return res.status(500).send(saveError);
                        }

                        return res.render("authenticated", {
                            showLoginButton: false,
                            username: response.account.username,
                            profile: false,
                        });
                    });
                });
            })
            .catch((error) => {
                res.status(500).send(error);
            });
    });

    // Displays all cached accounts
    router.get("/allAccounts", async (req, res) => {
        if (!req.session.homeAccountId) {
            return res.status(401).render("login", {
                showSignInButton: true,
            });
        }

        const account = await msalTokenCache.getAccountByHomeId(
            req.session.homeAccountId
        );
        if (!account) {
            return res.status(401).render("login", {
                showSignInButton: true,
            });
        }

        const formattedAccounts = [account].map((cachedAccount) => {
            let tenantProfiles = [];
            cachedAccount.tenantProfiles.forEach((profile) => {
                tenantProfiles.push(profile);
            });
            return { ...cachedAccount, tenantProfiles };
        });
        return res.render("authenticated", {
            accounts: JSON.stringify(formattedAccounts, null, 4),
        });
    });

    // Call a resource API with an Access Token silently obtained from the MSAL Cache
    router.get("/graphCall", async (req, res) => {
        if (!req.session.homeAccountId) {
            return res.status(401).render("login", {
                showSignInButton: true,
            });
        }

        const account = await msalTokenCache.getAccountByHomeId(
            req.session.homeAccountId
        );
        if (!account) {
            return res.status(401).render("login", {
                showSignInButton: true,
            });
        }

        try {
            const authResponse = await clientApplication.acquireTokenSilent({
                ...requestConfig.silentRequest,
                account,
            });
            return callResourceApi(
                res,
                authResponse,
                { showLoginButton: false },
                scenarioConfig
            );
        } catch (error) {
            return res.status(401).render("login", {
                failedSilentLogin: true,
                showSignInButton: true,
            });
        }
    });

    return app.listen(serverPort, () =>
        console.log(
            `Msal Node Silent Flow Sample app listening on port ${serverPort}!`
        )
    );
};

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample application.
 */
if (argv.$0 === "index.js") {
    const loggerOptions = {
        loggerCallback(loglevel, message, containsPii) {
            console.log(message);
        },
        piiLoggingEnabled: false,
        logLevel: msal.LogLevel.Verbose,
    };

    // Build MSAL ClientApplication Configuration object
    const clientConfig = {
        auth: {
            clientId: config.authOptions.clientId,
            authority: config.authOptions.authority,
            redirectUri: config.authOptions.redirectUri,
            clientSecret: process.env.CLIENT_SECRET,
            knownAuthorities: config.authOptions.knownAuthorities,
        },
        cache: {
            cachePlugin,
        },
        // Uncomment the code below to enable the MSAL logger
        /*
         *   system: {
         *    loggerOptions: loggerOptions
         *   }
         */
    };

    // Create an MSAL ConfidentialClientApplication object
    const confidentialClientApplication =
        new msal.ConfidentialClientApplication(clientConfig);
    const msalTokenCache = confidentialClientApplication.getTokenCache();

    // Execute sample application with the configured MSAL ConfidentialClientApplication
    return getTokenSilent(
        config,
        confidentialClientApplication,
        null,
        msalTokenCache
    );
}
// The application code is exported so it can be executed in automation environments
module.exports = getTokenSilent;
