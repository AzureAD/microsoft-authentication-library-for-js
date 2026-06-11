/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const path = require('path');

const DEFAULT_PORT = 30662;

//initialize express.
const app = express();

// Set the front-end folder to serve public assets.
app.use("/lib", express.static(path.join(__dirname, "../../../lib/msal-browser/lib")));

app.use(express.static('app/'));

// Set up a route for index.html.
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Start the server.
app.listen(DEFAULT_PORT);
console.log(`Listening on port ${DEFAULT_PORT}...`);
