/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const path = require('path');
const argv = require("yargs")
    .usage("Usage: $0 -p [PORT]")
    .alias("p", "port")
    .describe("port", "(Optional) Port Number - default is 30670")
    .strict()
    .argv;


const DEFAULT_PORT = 30670;

//initialize express.
const app = express();

// Initialize variables.
let port = DEFAULT_PORT; // -p {PORT} || 30662;
if (argv.p) {
    port = argv.p;
}

app.use(express.static(path.join(__dirname, 'app')));
app.use(express.json()); // Parse JSON bodies

// Serve MSAL library from local build
app.use('/lib', express.static(path.join(__dirname, '../../../lib/msal-browser/lib')));

// Serve nativeAuthConfig.json from its original location
app.get('/nativeAuthConfig.json', function (req, res) {
    res.sendFile(path.join(__dirname, 'nativeAuthConfig.json'));
});

// Set up a route for index.html.
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, "app", 'index.html'));
});

app.listen(port);
