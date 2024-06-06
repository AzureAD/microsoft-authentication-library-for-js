/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const express = require('express');
const session = require('express-session');
const hbs = require('express-handlebars');
const msal = require('@azure/msal-node');
const url = require('url');
require('dotenv').config();

const fetch = require('./fetch');
const config = require('./config/customConfig.json');

/**
 * Command line arguments can be used to configure:
 * - The port the application runs on
 * - The cache file location
 * - The authentication scenario/configuration file name
 */
const argv = require("../cliArgs");
const SERVER_PORT = argv.p || 3000;
const cacheLocation = argv.c || "./data/cache.json";
const cachePlugin = require('../cachePlugin')(cacheLocation);


const APP_STAGES = {
    SIGN_IN: 'sign_in',
    PASSWORD_RESET: 'password_reset',
    EDIT_PROFILE: 'edit_profile',
    ACQUIRE_TOKEN: 'acquire_token'
};

function main(scenarioConfig, clientApplication, port, redirectUri) {

    const cryptoProvider = new msal.CryptoProvider();

    // Set the port that the express server will listen on
    const serverPort = port || SERVER_PORT;

    // Create an express instance
    const app = express();

    /**
     * Using express-session middleware. Be sure to familiarize yourself with available options
     * and set them as desired. Visit: https://www.npmjs.com/package/express-session
     */
    const sessionConfig = {
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // set this to true on production
        }
    }

    app.use(session(sessionConfig));
    app.use(express.urlencoded({ extended: false }));
    app.use(express.json());

    // Set handlebars view engine
    app.engine('.hbs', hbs({ extname: '.hbs' }));
    app.set('view engine', '.hbs');

    /**
     * Prepares the auth code request parameters and initiates the first leg of auth code flow
     * by redirecting the app to the authorization code url.
     * @param req: Express request object
     * @param res: Express response object
     * @param next: Express next function
     * @param authCodeUrlRequestParams: parameters for requesting an auth code url
     * @param authCodeRequestParams: parameters for requesting tokens using auth code
     */
    const redirectToAuthCodeUrl = async (req, res, next, authCodeUrlRequestParams, authCodeRequestParams) => {

        // Generate PKCE Codes before starting the authorization flow
        const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

        // Set generated PKCE codes and method as session vars
        req.session.pkceCodes = {
            challengeMethod: 'S256',
            verifier: verifier,
            challenge: challenge,
        };

        /**
         * By manipulating the request objects below before each request, we can obtain
         * auth artifacts with desired claims. For more information, visit:
         * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
         * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
         **/

        req.session.authCodeUrlRequest = {
            redirectUri: redirectUri,
            codeChallenge: req.session.pkceCodes.challenge,
            codeChallengeMethod: req.session.pkceCodes.challengeMethod,
            ...authCodeUrlRequestParams,
        };

        req.session.authCodeRequest = {
            redirectUri: redirectUri,
            code: "",
            ...authCodeRequestParams,
        };

        // Get url to sign user in and consent to scopes needed for application
        try {
            const authCodeUrlResponse = await clientApplication.getAuthCodeUrl(req.session.authCodeUrlRequest);
            res.redirect(authCodeUrlResponse);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Attempts to acquire an access token silently, falling back to the auth code flow if it fails.
     * @param req: Express request object
     * @param res: Express response object
     * @param next: Express next function
     * @param scopes: list of scopes
     * @returns
     */
    const getToken = async (req, res, next, scopes) => {
        try {
            const tokenCache = clientApplication.getTokenCache();

            const account = req.session.account.homeAccountId
                ?
                await tokenCache.getAccountByHomeId(req.session.account.homeAccountId)
                :
                await tokenCache.getAccountByLocalId(req.session.account.localAccountId);

            const silentRequest = {
                account: account,
                scopes: scopes,
            };

            // acquire token silently to be used in resource call
            const tokenResponse = await clientApplication.acquireTokenSilent(silentRequest);

            if (!tokenResponse || tokenResponse.accessToken.length === 0) {
                // In B2C scenarios, sometimes an access token is returned empty.
                // In that case, we will acquire token interactively instead.
                throw new InteractionRequiredAuthError(ErrorMessages.INTERACTION_REQUIRED);
            }

            return tokenResponse;
        } catch (error) {
            if (error instanceof msal.InteractionRequiredAuthError) {
                req.session.csrfToken = cryptoProvider.createNewGuid();

                state = cryptoProvider.base64Encode(
                    JSON.stringify({
                        csrfToken: req.session.csrfToken,
                        appStage: APP_STAGES.ACQUIRE_TOKEN,
                    })
                );

                const authCodeUrlRequestParams = {
                    authority: scenarioConfig.policies.authorities.signUpSignIn.authority,
                    state: state,
                };

                const authCodeRequestParams = {
                    scopes: scopes,
                };

                return redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams);
            }

            next(error);
        }
    }

    app.get('/', function (req, res, next) {
        // if redirectUri is set to the main route "/", redirect to "/redirect" route for handling authZ code
        if (req.query.code) return res.redirect(url.format({ pathname: "/redirect", query: req.query }));

        res.render('index', {
            isAuthenticated: req.session.isAuthenticated,
            username: req.session.account ? req.session.account.username : '',
        });
    });

    app.get('/id', (req, res) => {
        if (!req.session.account) {
            return res.redirect('/sign-in');
        }

        res.render('id', { idTokenClaims: req.session.account.idTokenClaims });
    });

    // Initiates auth code grant for LOGIN
    app.get('/sign-in', (req, res, next) => {
        // create a GUID against crsf
        req.session.csrfToken = cryptoProvider.createNewGuid();

        /**
         * The MSAL Node library allows you to pass your custom state as state parameter in the Request object.
         * The state parameter can also be used to encode information of the app's state before redirect.
         * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
         */
        const state = cryptoProvider.base64Encode(
            JSON.stringify({
                csrfToken: req.session.csrfToken,
                appStage: APP_STAGES.SIGN_IN,
            })
        );

        const authCodeUrlRequestParams = {
            authority: scenarioConfig.policies.authorities.signUpSignIn.authority,
            state: state,
        };

        const authCodeRequestParams = {
            /**
             * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
             * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
             */
            scopes: [],
        };

        return redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams);
    });

    // Initiates auth code grant for edit_profile user flow
    app.get('/edit-profile', (req, res, next) => {
        if (!req.session.account) {
            return res.redirect('/sign-in');
        }

        req.session.csrfToken = cryptoProvider.createNewGuid();

        state = cryptoProvider.base64Encode(
            JSON.stringify({
                csrfToken: req.session.csrfToken,
                appStage: APP_STAGES.EDIT_PROFILE,
            })
        );

        const authCodeUrlRequestParams = {
            authority: scenarioConfig.policies.authorities.editProfile.authority,
            state: state,
        };

        const authCodeRequestParams = {};

        return redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams);
    });

    app.get('/call-api', async (req, res, next) => {
        if (!req.session.account) {
            return res.redirect('/sign-in');
        }

        const tokenResponse = await getToken(req, res, next, [...scenarioConfig.resourceApi.scopes]);
        const apiResponse = await fetch(scenarioConfig.resourceApi.endpoint, tokenResponse.accessToken);

        res.render('api', {
            response: apiResponse,
        });
    });

    app.get('/sign-out', async (req, res, next) => {
        /**
         * Construct a logout URI and redirect the user to end the
         * session with Azure AD B2C. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory-b2c/openid-connect#send-a-sign-out-request
         */
        const logoutUri =
            `${scenarioConfig.policies.authorities.signUpSignIn.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=http://localhost:${serverPort}`;

        try {
            const tokenCache = clientApplication.getTokenCache();

            const account = req.session.account.homeAccountId
                ?
                await tokenCache.getAccountByHomeId(req.session.account.homeAccountId)
                :
                await tokenCache.getAccountByLocalId(req.session.account.localAccountId);

            await tokenCache.removeAccount(account);

            req.session.destroy(() => {
                res.redirect(logoutUri);
            });
        } catch (error) {
            next(error);
        }
    });

    // Second leg of auth code grant
    app.get('/redirect', async (req, res, next) => {
        if (!req.query.state) {
            return next(new Error('State not found'));
        }

        // read the state object and determine the stage of the flow
        const state = JSON.parse(cryptoProvider.base64Decode(req.query.state));

        if (state.csrfToken === req.session.csrfToken) {
            switch (state.appStage) {
                case APP_STAGES.SIGN_IN:
                    req.session.authCodeRequest.code = req.query.code; // authZ code
                    req.session.authCodeRequest.codeVerifier = req.session.pkceCodes.verifier // PKCE Code Verifier

                    try {
                        const tokenResponse = await clientApplication.acquireTokenByCode(req.session.authCodeRequest);
                        req.session.account = tokenResponse.account;
                        req.session.isAuthenticated = true;
                        res.redirect('/');
                    } catch (error) {
                        if (req.query.error) {
                            /**
                             * When the user selects 'forgot my password' on the sign-in page, B2C service will throw an error.
                             * We are to catch this error and redirect the user to LOGIN again with the resetPassword authority.
                             * For more information, visit: https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview#linking-user-flows
                             */
                            if (JSON.stringify(req.query.error_description).includes('AADB2C90118')) {
                                // create a GUID against crsf
                                req.session.csrfToken = cryptoProvider.createNewGuid();

                                const state = cryptoProvider.base64Encode(
                                    JSON.stringify({
                                        csrfToken: req.session.csrfToken,
                                        appStage: APP_STAGES.PASSWORD_RESET,
                                    })
                                );

                                const authCodeUrlRequestParams = {
                                    authority: scenarioConfig.policies.authorities.resetPassword.authority,
                                    state: state,
                                };

                                const authCodeRequestParams = {};

                                // if coming for password reset, set the authority to password reset
                                return redirectToAuthCodeUrl(req, res, next, authCodeUrlRequestParams, authCodeRequestParams);
                            }
                        }
                        next(error);
                    }

                    break;
                case APP_STAGES.ACQUIRE_TOKEN:
                    req.session.authCodeRequest.code = req.query.code; // authZ code
                    req.session.authCodeRequest.codeVerifier = req.session.pkceCodes.verifier // PKCE Code Verifier

                    try {
                        const tokenResponse = await clientApplication.acquireTokenByCode(req.session.authCodeRequest);
                        req.session.accessToken = tokenResponse.accessToken;
                        res.redirect('/call-api');
                    } catch (error) {
                        next(error);
                    }

                    break;
                case APP_STAGES.PASSWORD_RESET:
                case APP_STAGES.EDIT_PROFILE:
                    // redirect the user to sign-in again
                    res.redirect('/sign-in');
                    break;
                default:
                    next(new Error('cannot determine app stage'));
            }
        } else {
            next(new Error('crsf token mismatch'));
        }
    });

    return app.listen(serverPort, () => console.log(`Msal Node Auth Code Sample app listening on port ${serverPort}!`));
}

/**
 * The code below checks if the script is being executed manually or in automation.
 * If the script was executed manually, it will initialize a ConfidentialClientApplication object
 * and execute the sample application.
 */
if (argv.$0 === "index.js") {
    const redirectUri = config.authOptions.redirectUri;

    const confidentialClientConfig = {
        auth: {
            clientId: config.authOptions.clientId,
            authority: config.policies.authorities.signUpSignIn.authority,
            clientSecret: process.env.AZURE_CLIENT_SECRET,
            knownAuthorities: [config.policies.authorityDomain],
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

    // Create an MSAL PublicClientApplication object
    const confidentialClientApp = new msal.ConfidentialClientApplication(confidentialClientConfig);

    // Execute sample application with the configured MSAL PublicClientApplication
    return main(config, confidentialClientApp, null, redirectUri);
}

// The application code is exported so it can be executed in automation environments
module.exports = main;
