/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require("express");
const exphbs = require("express-handlebars");
const msal = require("@azure/msal-node");

const api = require("./api");
const policies = require("./policies");

const SERVER_PORT = process.env.PORT || 3000;

/**
 * Cache Plugin configuration
 */
const cacheLocation = "./data/cache.json";// replace this string with the path to your valid cache file.
const cachePlugin = require('../cachePlugin')(cacheLocation);

/**
 * Public Client Application Configuration
 */
const publicClientConfig = {
    auth: {
        clientId: "d9a54ee5-0ab6-4afc-b407-1fc80a89f24d", 
        authority: policies.authorities.signUpSignIn.authority,
        knownAuthorities: [policies.authorityDomain],
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Current web API coordinates were pre-registered in a B2C tenant.
const apiConfig = {
    webApiScopes: ["https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read"],
    webApiUri: "https://fabrikamb2chello.azurewebsites.net/hello"
};

const SCOPES = {
    oidc: ["openid", "profile"],
    resource1: [...apiConfig.webApiScopes],
}

/**
 * The MSAL.js library allows you to pass your custom state as state parameter in the Request object
 * By default, MSAL.js passes a randomly generated unique state parameter value in the authentication requests.
 * The state parameter can also be used to encode information of the app's state before redirect. 
 * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
 * For more information, visit: https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request
 */

const APP_STATES = {
    login: "login",
    call_api: "call_api",
}

/** 
 * Request Configuration
 * We manipulate these two request objects below 
 * to acquire a token with the appropriate claims.
 */
const authCodeRequest = {
    redirectUri: publicClientConfig.auth.redirectUri
};

const tokenRequest = {
    redirectUri: publicClientConfig.auth.redirectUri
};

// Initialize MSAL Node
const pca = new msal.PublicClientApplication(publicClientConfig);

// Create an express instance
const app = express();

// Store accessToken in memory
app.locals.accessToken = null;
// Store homeAccountId in memory
app.locals.homeAccountId = null;

/**
 * Proof Key for Code Exchange (PKCE) Setup
 * 
 * MSAL enables PKCE in the Authorization Code Grant Flow by including the codeChallenge and codeChallengeMethod parameters
 * in the request passed into getAuthCodeUrl() API, as well as the codeVerifier parameter in the
 * second leg (acquireTokenByCode() API).
 * 
 * MSAL Node provides PKCE Generation tools through the CryptoProvider class, which exposes
 * the generatePkceCodes() asynchronous API. As illustrated in the example below, the verifier
 * and challenge values should be generated previous to the authorization flow initiation.
 * 
 * For details on PKCE code generation logic, consult the 
 * PKCE specification https://tools.ietf.org/html/rfc7636#section-4
 */

// Set up PKCE Code object in app's local memory so it's shared between routes
app.locals.pkceCodes = {
    challengeMethod: "S256", // Use SHA256 Algorithm
    verifier: "", // Generate a code verifier for the Auth Code Request first
    challenge: "" // Generate a code challenge from the previously generated code verifier
};

// Set handlebars view engine
app.engine(".hbs", exphbs({ extname: ".hbs" }));
app.set("view engine", ".hbs");

/**
 * This method is used to generate an auth code request
 * @param {string} authority: the authority to request the auth code from 
 * @param {array} scopes: scopes to request the auth code for 
 * @param {string} state: state of the application
 * @param {object} res: express middleware response object
 */
const getAuthCode = (authority, scopes, state, res) => {

    // prepare the request
    authCodeRequest.authority = authority;
    authCodeRequest.scopes = scopes;
    authCodeRequest.state = state;

    tokenRequest.authority = authority;

    // Initialize CryptoProvider instance
    const cryptoProvider = new msal.CryptoProvider();
    // Generate PKCE Codes before starting the authorization flow
    cryptoProvider.generatePkceCodes().then(({ verifier, challenge }) => {
        // Set generated PKCE Codes as app variables
        app.locals.pkceCodes.verifier = verifier;
        app.locals.pkceCodes.challenge = challenge;

        // Add PKCE code challenge and challenge method to authCodeUrl request object
        authCodeRequest.codeChallenge = app.locals.pkceCodes.challenge, // PKCE Code Challenge
        authCodeRequest.codeChallengeMethod = app.locals.pkceCodes.challengeMethod // PKCE Code Challenge Method
        
        // Get url to sign user in and consent to scopes needed for application
        return pca.getAuthCodeUrl(authCodeRequest).then((response) => {
            res.redirect(response);
        })
        .catch((error) => {
            res.status(500).send(error);
        });
    });
}

/**
 * App Routes
 */
app.get("/", (req, res) => {
    res.render("login", { showSignInButton: true });
});

// Initiates auth code grant for login
app.get("/login", (req, res) => {
    getAuthCode(policies.authorities.signUpSignIn.authority, SCOPES.oidc, APP_STATES.login, res);
})

// Initiates auth code grant for web API call
app.get("/api", async (req, res) => {
    const msalTokenCache = pca.getTokenCache();
    // Find Account by Local Account Id
    account = await msalTokenCache.getAccountByHomeId(app.locals.homeAccountId);

    // build silent request
    const silentRequest = {
        account: account,
        scopes: SCOPES.resource1
    };

    // acquire Token Silently to be used in when calling web API
    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            const username = response.account.username;
            // call web API after successfully acquiring token
            api.callWebApi(apiConfig.webApiUri, response.accessToken, (response) => {
                const templateParams = { showLoginButton: false, username: username, profile: JSON.stringify(response, null, 4) };
                res.render("api", templateParams);
            });
        })
        .catch((error) => {
            console.log('cannot acquire token silently')
            console.log(error);
            res.render("api", templateParams);
        });
});

// Second leg of auth code grant
app.get("/redirect", (req, res) => {

    // determine where the request comes from
    if (req.query.state === APP_STATES.login) {

        // prepare the request for authentication
        tokenRequest.scopes = [...SCOPES.oidc, ...SCOPES.resource1];
        tokenRequest.code = req.query.code;
        tokenRequest.codeVerifier = app.locals.pkceCodes.verifier // PKCE Code Verifier
        
        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                app.locals.homeAccountId = response.account.homeAccountId;
                const templateParams = { showLoginButton: false, username: response.account.username, profile: false };
                res.render("api", templateParams);
            }).catch((error) => {
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.call_api) {

        // prepare the request for calling the web API
        tokenRequest.authority = policies.authorities.signUpSignIn.authority;
        tokenRequest.scopes = SCOPES.resource1;
        tokenRequest.code = req.query.code;
        tokenRequest.codeVerifier = app.locals.pkceCodes.verifier // PKCE Code Verifier

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                console.log(response);
                // store access token somewhere
                app.locals.accessToken = response.accessToken;

                // call the web API
                api.callWebApi(apiConfig.webApiUri, response.accessToken, (response) => {
                    const templateParams = { showLoginButton: false, profile: JSON.stringify(response, null, 4) };
                    res.render("api", templateParams);
                });
                
            }).catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });

    } else {
        res.status(500).send("Unknown");
    }
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
