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
 * Confidential Client Application Configuration
 */
const confidentialClientConfig = {
    auth: {
        clientId: "e6e1bea3-d98f-4850-ba28-e80ed613cc72", 
        authority: policies.authorities.signUpSignIn.authority, 
        clientSecret: "ENTER_CLIENT_SECRET",
        knownAuthorities: [policies.authorityDomain], 
        redirectUri: "http://localhost:3000/redirect",
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
    password_reset: "password_reset",
}

/** 
 * Request Configuration
 * We manipulate these two request objects below 
 * to acquire a token with the appropriate claims.
 */
const authCodeRequest = {
    redirectUri: confidentialClientConfig.auth.redirectUri,
};

const tokenRequest = {
    redirectUri: confidentialClientConfig.auth.redirectUri,
};

// Initialize MSAL Node
const cca = new msal.ConfidentialClientApplication(confidentialClientConfig);

// Create an express instance
const app = express();

// Store accessToken in memory
app.locals.accessToken = null;

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

    // request an authorization code to exchange for a token
    return cca.getAuthCodeUrl(authCodeRequest)
        .then((response) => {
            res.redirect(response);
        })
        .catch((error) => {
            res.status(500).send(error);
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
    if (authCodeRequest.state === APP_STATES.password_reset) {
        // if coming for password reset, set the authority to password reset
        getAuthCode(policies.authorities.resetPassword.authority, SCOPES.oidc, APP_STATES.password_reset, res);
    } else {
        // else, login as usual
        getAuthCode(policies.authorities.signUpSignIn.authority, SCOPES.oidc, APP_STATES.login, res);
    }
})

// Initiates auth code grant for edit_profile user flow
app.get("/profile", (req, res) => {
    getAuthCode(policies.authorities.editProfile.authority, SCOPES.oidc, APP_STATES.login, res);
});

// Initiates auth code grant for web API call
app.get("/api", async (req, res) => {
    // If no accessToken in store, request authorization code to exchange for a token
    if (!app.locals.accessToken) {
        getAuthCode(policies.authorities.signUpSignIn.authority, SCOPES.resource1, APP_STATES.call_api, res);
    } else {
        // else, call the web API
        api.callWebApi(apiConfig.webApiUri, app.locals.accessToken, (response) => {
            const templateParams = { showLoginButton: false, profile: JSON.stringify(response, null, 4) };
            res.render("api", templateParams);
        });
    }
});

// Second leg of auth code grant
app.get("/redirect", (req, res) => {

    // determine where the request comes from
    if (req.query.state === APP_STATES.login) {

        // prepare the request for authentication
        tokenRequest.scopes = SCOPES.oidc;
        tokenRequest.code = req.query.code;

        cca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                const templateParams = { showLoginButton: false, username: response.account.username, profile: false };
                res.render("api", templateParams);
            }).catch((error) => {
                if (req.query.error) {

                    /**
                     * When the user selects "forgot my password" on the sign-in page, B2C service will throw an error.
                     * We are to catch this error and redirect the user to login again with the resetPassword authority.
                     * For more information, visit: https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview#linking-user-flows
                     */
                    if (JSON.stringify(req.query.error_description).includes("AADB2C90118")) {
                        authCodeRequest.authority = policies.authorities.resetPassword;
                        authCodeRequest.state = APP_STATES.password_reset;
                        return res.redirect('/login');
                    }
                }
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.call_api) {

        // prepare the request for calling the web API
        tokenRequest.authority = policies.authorities.signUpSignIn.authority;
        tokenRequest.scopes = SCOPES.resource1;
        tokenRequest.code = req.query.code;

        cca.acquireTokenByCode(tokenRequest)
            .then((response) => {

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

    } else if (req.query.state === APP_STATES.password_reset) {

        // once the password is reset, redirect the user to login again with the new password
        authCodeRequest.state = APP_STATES.login;
        res.redirect('/login');
    } else {
        res.status(500).send("Unknown");
    }
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
