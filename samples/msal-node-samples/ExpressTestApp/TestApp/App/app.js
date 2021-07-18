/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const session = require('express-session');
const path = require('path');

const router = require('./routes/router');

const SERVER_PORT = process.env.PORT || 4000;

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
app.use(session({ secret: 'ENTER_YOUR_SECRET_HERE', resave: false, saveUninitialized: false }));

app.use(router);

app.listen(SERVER_PORT, () => console.log(`Msal Node Auth Code Sample app listening on port ${SERVER_PORT}!`));