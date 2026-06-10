/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 30662;

//initialize express.
const app = express();

// Serve the msal-browser UMD bundle so that index.html can load it without
// relying on a CDN. Uses the installed npm package when available, or falls
// back to the local source build when developing within the monorepo.
const nodeModulesLib = path.join(__dirname, "node_modules/@azure/msal-browser/lib");
const sourceLib = path.join(__dirname, "../../../lib/msal-browser/lib");
const msalBrowserLib = fs.existsSync(nodeModulesLib) ? nodeModulesLib : sourceLib;

app.use("/lib", express.static(msalBrowserLib));

app.use(express.static('app/'));

// Set up a route for index.html.
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Start the server.
app.listen(DEFAULT_PORT);
console.log(`Listening on port ${DEFAULT_PORT}...`);
