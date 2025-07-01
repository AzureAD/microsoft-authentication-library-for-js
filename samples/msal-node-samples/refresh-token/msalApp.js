// Import dependencies
const express = require("express");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const msal = require('@azure/msal-node');
require('dotenv').config();

const config = require('./config/customConfig.json');

const DiskCache = require('./adalCustomCache');
const diskCache = new DiskCache(config.adalCacheLocation);

const msalCachePlugin = require('./msalCachePlugin');

const REDIRECT_URI = config.redirectUri;

const msalConfig = {
    auth: {
        clientId: config.clientId,
        authority: `${config.authority}/${config.tenantInfo}`,
        clientSecret: process.env.CLIENT_SECRET
    },
    cache: {
        cachePlugin: msalCachePlugin(config.msalCacheLocation)
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
}

// Initialize MSAL Node application object using authentication parameters
const cca = new msal.ConfidentialClientApplication(msalConfig);

const cryptoProvider = new msal.CryptoProvider();

// Initialize express
const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/**
 * Using express-session middleware for persistent user session. Be sure to
 * familiarize yourself with available options. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: process.env.CLIENT_SECRET, // or any other random string of characters
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}));

app.get('/', async (req, res, next) => {
    try {
        // retrieve account
        const account = await (await cca.getTokenCache()).getAccountByHomeId(req.session.account?.homeAccountId);

        if (!account) {
            console.error('Account not found!');
            throw new msal.InteractionRequiredAuthError();
        }

        const tokenResponse = await cca.acquireTokenSilent({
            account: account,
            scopes: ["user.read"],
        });

        res.json({
            message: 'successful silent flow token acquisition',
            response: tokenResponse
        });
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            /**
             * If the silent token acquisition throws an interaction_required error,
             * we catch it and attempt to find a refresh token for this user from ADAL cache.
             * If no cached refresh token is found or if the refresh token is expired,
             * we fallback to interactive flow via getAuthCodeUrl -> acquireTokenByCode.
             */
            diskCache.find({ userId: req.cookies.userId }, async (error, data) => {
                try {
                    if (error || !data || !data.length) throw new Error('Could not retrieve user cache');

                    /**
                     * You can add the /.default scope suffix to the resource to help migrate your apps
                     * from the v1.0 endpoint (ADAL) to the Microsoft identity platform (MSAL).
                     * For example, for the resource value of https://graph.microsoft.com,
                     * the equivalent scope value is https://graph.microsoft.com/.default
                     */
                    const tokenResponse = await cca.acquireTokenByRefreshToken({
                        refreshToken: data[0].refreshToken,
                        scopes: ['https://graph.microsoft.com/.default'],
                        forceCache: true,
                    });

                    req.session.account = tokenResponse.account;

                    /**
                     * Once you successfully acquire an access token using a refresh token,
                     * we recommend to clear the ADAL cache for this user.
                     */
                    diskCache.remove(data, (error, data) => {
                        if (error) return next(error);

                        res.json({
                            message: 'successful refresh token flow token acquisition',
                            response: tokenResponse
                        });
                    })
                } catch (error) {
                    // create a random string of characters against csrf
                    req.session.state = cryptoProvider.createNewGuid();

                    // Construct a request object for auth code url
                    const authCodeUrlParameters = {
                        scopes: ["user.read"],
                        responseMode: 'form_post',
                        redirectUri: REDIRECT_URI,
                        state: req.session.state,
                    };

                    try {
                        // Request auth code url, then redirect
                        const authCodeUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
                        res.redirect(authCodeUrl);
                    } catch (error) {
                        next(error);
                    }
                }
            });
        } else {
            next(error);
        }
    }
});

app.post('/redirect', async (req, res, next) => {
    if (req.body.state) {
        if (req.session.state === req.body.state) {
            try {
                // Exchange the auth code for tokens
                const tokenResponse = await cca.acquireTokenByCode({
                    code: req.body.code,
                    scopes: ["user.read"],
                    redirectUri: REDIRECT_URI,
                })

                req.session.account = tokenResponse.account;

                res.json({
                    message: 'successful code flow token acquisition',
                    response: tokenResponse
                });
            } catch (error) {
                next(error);
            }
        } else {
            next(new Error('state does not match'));
        }
    } else {
        next(new Error('state not found'));
    }
});

app.listen(3000, () => console.log(`listening on port 3000!`));
