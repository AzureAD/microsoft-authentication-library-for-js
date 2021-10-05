/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require('express');
const session = require('express-session');
const exphbs = require('express-handlebars');
const msal = require('@azure/msal-node');
const { promises: fs } = require("fs");

const api = require('./api');
const policies = require('./policies');

const SERVER_PORT = process.env.PORT || 3000;

/**
 * Cache Plugin configuration
 */
const cachePath = "./data/cache.json"; // Replace this string with the path to your valid cache file.

const beforeCacheAccess = async (cacheContext) => {
    try {
        const cacheFile = await fs.readFile(cachePath, "utf-8");
        cacheContext.tokenCache.deserialize(cacheFile);
    } catch (error) {
        // if cache file doesn't exists, create it
        cacheContext.tokenCache.deserialize(await fs.writeFile(cachePath, ""));
    }
};

const afterCacheAccess = async (cacheContext) => {
    if (cacheContext.cacheHasChanged) {
        try {
            await fs.writeFile(cachePath, cacheContext.tokenCache.serialize());
        } catch (error) {
            console.log(error);
        }
    }
};

const cachePlugin = {
    beforeCacheAccess,
    afterCacheAccess
};

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
    login: 'login',
    call_api: 'call_api',
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

    tokenRequest.authority = authority;

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
app.get('/', (req, res) => {
    res.render('login', { showSignInButton: true });
});

// Initiates auth code grant for login
app.get('/login', (req, res) => {
    getAuthCode(policies.authorities.signUpSignIn.authority, [], APP_STATES.login, req, res);
})

// Initiates auth code grant for web API call
app.get('/api', async (req, res) => {
    const msalTokenCache = pca.getTokenCache();
    // Find Account by Local Account Id
    account = await msalTokenCache.getAccountByHomeId(req.session.homeAccountId);

    // build silent request
    const silentRequest = {
        account: account,
        scopes: apiConfig.webApiScopes
    };

    // acquire Token Silently to be used in when calling web API
    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            const username = response.account.username;
            // call web API after successfully acquiring token
            api.callWebApi(apiConfig.webApiUri, response.accessToken, (response) => {
                const templateParams = { showSignInButton: false, username: username, profile: JSON.stringify(response, null, 4) };
                res.render('api', templateParams);
            });
        })
        .catch((error) => {
            console.log('cannot acquire token silently')
            console.log(error);
            res.render('api', templateParams);
        });
});

// Second leg of auth code grant
app.get('/redirect', (req, res) => {

    // determine where the request comes from
    if (req.query.state === APP_STATES.login) {

        // prepare the request for authentication
        tokenRequest.scopes = [];
        tokenRequest.code = req.query.code;
        tokenRequest.codeVerifier = req.session.pkceCodes.verifier // PKCE Code Verifier
        
        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                req.session.homeAccountId = response.account.homeAccountId;
                const templateParams = { showSignInButton: false, username: response.account.username, profile: false };
                res.render('api', templateParams);
            }).catch((error) => {
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.call_api) {

        // prepare the request for calling the web API
        tokenRequest.authority = policies.authorities.signUpSignIn.authority;
        tokenRequest.scopes = apiConfig.webApiScopes;
        tokenRequest.code = req.query.code;
        tokenRequest.codeVerifier = req.session.pkceCodes.verifier // PKCE Code Verifier

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                console.log(response);
                
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
