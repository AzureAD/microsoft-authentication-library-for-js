/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const session = require('express-session');
const path = require('path');

const msal = require('@azure/msal-node');
const validator = require('@azure/node-token-validation');

const appSettings = require('./appSettings.js');
const mainRouter = require('./routes/mainRouter.js');

const SERVER_PORT = process.env.PORT || 4000;

// initialize express
const app = express(); 

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

app.use(express.static(path.join(__dirname, './public')));

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options and set them as desired. 
 * Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: 'ADD_CLIENT_SECRET_HERE',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}));

const cacheLocation = "./data/cache.json";
const cachePlugin = require('./cachePlugin')(cacheLocation);

const loggerOptions = {
    loggerCallback(loglevel, message, containsPii) {
        console.log(message);
    },
            piiLoggingEnabled: false,
    logLevel: validator.LogLevel.Info,
};

// MSAL configurations
const clientConfig = {
    auth: {
        clientId: appSettings.appCredentials.clientId,
        authority: appSettings.appCredentials.authority,
        tenantId: appSettings.appCredentials.tenantId,
        clientSecret: appSettings.appCredentials.clientSecret
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: loggerOptions
    } 
};

// Token validator configurations
const tokenValidatorConfig = {
    auth: {
        authority: appSettings.appCredentials.authority,
        protocolMode: appSettings.appCredentials.protocolMode
    },
    system: {
        loggerOptions: loggerOptions
    } 
};

// Instantiate msal-node
const msalClient = new msal.ConfidentialClientApplication(clientConfig);
const cryptoProvider = new msal.CryptoProvider();

// Instantiate token validator
const tokenValidator = new validator.TokenValidator(tokenValidatorConfig);

app.use(mainRouter(msalClient, tokenValidator, cryptoProvider));

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));

module.exports = app;
