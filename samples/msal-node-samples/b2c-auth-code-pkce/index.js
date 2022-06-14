/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const msal = require('@azure/msal-node');

const api = require('./api');
const policies = require('./policies');

const SERVER_PORT = process.env.PORT || 3000;

/**
 * Public Client Application Configuration
 */
const publicClientConfig = {
    auth: {
        clientId: '67ffe8a0-db42-464a-88d7-c26cbdd06ce2',
        authority: policies.authorities.signUpSignIn.authority,
        knownAuthorities: [policies.authorityDomain],
        redirectUri: 'http://localhost:3000/redirect',
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
    webApiScopes: ['https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read'],
    webApiUri: 'https://fabrikamb2chello.azurewebsites.net/hello'
};

/**
 * The MSAL.js library allows you to pass your custom state as state parameter in the Request object
 * By default, MSAL.js passes a randomly generated unique state parameter value in the authentication requests.
 * The state parameter can also be used to encode information of the app's state before redirect. 
 * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
 * For more information, visit: https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request
 */

const APP_STATES = {
    LOGIN: 'login',
    CALL_API: 'call_api',
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

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */
const sessionConfig = {
    secret: 'ENTER_YOUR_SECRET_HERE',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}

if (app.get('env') === 'production') {
    app.set('trust proxy', 1) // trust first proxy e.g. App Service
    sessionConfig.cookie.secure = true // serve secure cookies
}

app.use(session(sessionConfig));

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

// Set handlebars view engine
app.engine('.hbs', exphbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

/**
 * This method is used to generate an auth code request
 * @param {string} authority: the authority to request the auth code from 
 * @param {array} scopes: scopes to request the auth code for 
 * @param {string} state: state of the application
 * @param {Object} req: express middleware request object
 * @param {Object} res: express middleware response object
 */
const getAuthCode = (authority, scopes, state, req, res) => {

    // prepare the request
    authCodeRequest.authority = authority;
    authCodeRequest.scopes = scopes;
    authCodeRequest.state = state;

    authCodeRequest.authority = authority;
    // Initialize CryptoProvider instance
    const cryptoProvider = new msal.CryptoProvider();
    // Generate PKCE Codes before starting the authorization flow
    cryptoProvider.generatePkceCodes().then(({ verifier, challenge }) => {
        
        // create session object if does not exist
        if (!req.session.pkceCodes) {
            req.session.pkceCodes = {
                challengeMethod: 'S256'
            };
        }

        // Set generated PKCE Codes as session vars
        req.session.pkceCodes.verifier = verifier;
        req.session.pkceCodes.challenge = challenge;


        // Add PKCE code challenge and challenge method to authCodeUrl request object
        authCodeRequest.codeChallenge = req.session.pkceCodes.challenge;
        authCodeRequest.codeChallengeMethod = req.session.pkceCodes.challengeMethod;

        // Get url to sign user in and consent to scopes needed for application
        pca.getAuthCodeUrl(authCodeRequest).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });
}

/**
 * App Routes
 */
app.get('/', (req, res) => {
    res.render('login', { showSignInButton: true });
});

// Initiates auth code grant for LOGIN
app.get('/login', (req, res) => {
    getAuthCode(policies.authorities.signUpSignIn.authority, [], APP_STATES.LOGIN, req, res);
})

// Initiates auth code grant for web API call
app.get('/api', async (req, res) => {
    // If no accessToken in store, request authorization code to exchange for a token
    if (!req.session.accessToken) {
        getAuthCode(policies.authorities.signUpSignIn.authority, apiConfig.webApiScopes, APP_STATES.CALL_API, req, res);
    } else {
        // else, call the web API
        api.callWebApi(apiConfig.webApiUri, req.session.accessToken, (response) => {
            const templateParams = { showSignInButton: false, profile: JSON.stringify(response, null, 4) };
            res.render('api', templateParams);
        });
    }
});

// Second leg of auth code grant
app.get('/redirect', (req, res) => {

    // determine where the request comes from
    if (req.query.state === APP_STATES.LOGIN) {

        // prepare the request for authentication
        tokenRequest.scopes = [];
        tokenRequest.code = req.query.code;
        tokenRequest.codeVerifier = req.session.pkceCodes.verifier;

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                const templateParams = { showSignInButton: false, username: response.account.username, profile: false };
                res.render('api', templateParams);
            }).catch((error) => {
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.CALL_API) {

        // prepare the request for calling the web API
        tokenRequest.authority = policies.authorities.signUpSignIn.authority;
        tokenRequest.scopes = apiConfig.webApiScopes;
        tokenRequest.code = req.query.code;
        tokenRequest.codeVerifier = req.session.pkceCodes.verifier;

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {

                // store access token somewhere
                req.session.accessToken = response.accessToken;

                // call the web API
                api.callWebApi(apiConfig.webApiUri, response.accessToken, (response) => {
                    const templateParams = { showSignInButton: false, profile: JSON.stringify(response, null, 4) };
                    res.render('api', templateParams);
                });

            }).catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });

    } else {
        res.status(500).send('Unknown');
    }
});

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));
