/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const session = require('express-session');
const path = require('path');

const MsIdExpress = require('microsoft-identity-express');
const appSettings = require('./appSettings.js');
const validator = require('@azure/node-token-validation');

const mainController = require('./controllers/mainController');

const SERVER_PORT = process.env.PORT || 4000;

// initialize express
const app = express(); 

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

app.use(express.static(path.join(__dirname, './public')));

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set them as desired. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    secret: 'DI-7Q~tRB6NAIZz3fB6qR1jTJ~F0iaapUFDE2',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true on production
    }
}));

// instantiate the wrapper
const msid = new MsIdExpress.WebAppAuthClientBuilder(appSettings).build();

// initialize the wrapper
app.use(msid.initialize());

// app routes
app.get('/', (req, res) => res.redirect('/home'));
app.get('/home', mainController.getHomePage);

// authentication routes
app.get('/signin', 
    msid.signIn({
        postLoginRedirect: '/'
    }
));

app.get('/signout', 
    msid.signOut({
        postLogoutRedirect: '/'
    }
));

// secure routes
app.get('/id', 
    msid.isAuthenticated(), 
    mainController.getIdPage
);

// token validation
const loggerOptions = {
  loggerCallback(loglevel, message, containsPii) {
      console.log(message);
  },
        piiLoggingEnabled: false,
  logLevel: validator.LogLevel.Verbose,
};

const tokenValidatorConfig = {
  auth: {
    clientId: appSettings.appCredentials.clientId,
    authority: `https://login.microsoftonline.com/${appSettings.appCredentials.tenantId}/`,
    protocolMode: 'AAD'
  },
  system: {
      loggerOptions: loggerOptions
  } 
};

const tokenValidator = new validator.TokenValidator(tokenValidatorConfig);

const tokenValidationParams = {
  validIssuers: ["issuer-here"],
  validAudiences: ["audience-here"]
};

app.get('/validate', 
  msid.isAuthenticated(),
  msid.getToken({
    resource: msid.appSettings.protectedResources.custom
  }),
  tokenValidator.addAuthorizationHeaderMiddleware('custom'),
  tokenValidator.validateTokenMiddleware(tokenValidationParams), 
  (req, res) => {
    console.log("VALIDATION RESPONSE: ", res);
    res.json('token validation complete');
});

// unauthorized
app.get('/error', (req, res) => res.redirect('/500.html'));

// error
app.get('/unauthorized', (req, res) => res.redirect('/401.html'));

// 404
app.get('*', (req, res) => res.status(404).redirect('/404.html'));

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));

module.exports = app;
