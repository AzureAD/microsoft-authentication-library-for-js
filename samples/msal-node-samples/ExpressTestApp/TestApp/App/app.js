/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require('path');
const redis = require('redis');
const express = require('express');
const session = require('express-session');
const RedisStore = require('connect-redis')(session); // persist session in redis

const msalWrapper = require('msal-express-wrapper/dist/AuthProvider');
const appSettings = require('../appSettings.json');
const router = require('./routes/router');

const SERVER_PORT = process.env.PORT || 4000;

/**
* Instantiate the redis client, which is used in persistenceHelper.
* This provides basic get and set methods for the cachePlugin.
*/
const redisClient = redis.createClient();
redisClient.on('error', console.error);

const persistenceHelper = require('./utils/persistenceHelper')(redisClient);
const cachePlugin = require('./utils/cachePlugin')(persistenceHelper);

const app = express();

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));

app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, './public')));

/**
 * Using express-session middleware. Be sure to familiarize yourself with available options
 * and set the desired options. Visit: https://www.npmjs.com/package/express-session
 */
app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: 'ENTER_YOUR_SECRET_HERE', 
    resave: false, 
    saveUninitialized: false,
    cookie: {
        secure: false, // set this to true when deploying
    }
}));

const authProvider = new msalWrapper.AuthProvider(appSettings, cachePlugin);

/**
* When using a distributed token cache, msal's in-memory cache should only load
* the cache blob for the currently served user from the persistence store (here, Redis). 
* This custom middleware first passes the session variable to cachePlugin object, and 
* then re-initializes msal's token cache plugin.
*/
function initializeTokenCachePlugin(req, res, next) {
    const cachePlugin = require('./utils/cachePlugin')(persistenceHelper, req.session.id);
    authProvider.msalClient.tokenCache.persistence = cachePlugin;
    next();
}

app.use(initializeTokenCachePlugin);

app.use(router(authProvider));

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));