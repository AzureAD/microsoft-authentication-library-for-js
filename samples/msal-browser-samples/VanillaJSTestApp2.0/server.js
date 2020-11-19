/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
    .usage('Usage: $0 -sample [sample-name] -p [PORT]')
    .alias('s', 'sample')
    .alias('p', 'port')
    .describe('sample', '(Optional) Name of sample to run')
    .describe('port', '(Optional) Port Number - default is 30662')
    .strict()
    .argv;

const DEFAULT_PORT = 30662;
const APP_DIR = __dirname + `/app`;

// Get all sample folders
const sampleFolders = fs.readdirSync(APP_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && file.name !== "sample_template";
}).map(function(file) {
    return file.name;
});

//initialize express.
const app = express();

// Initialize variables.
let port = DEFAULT_PORT; // -p {PORT} || 30662;
if (argv.p) {
    port = argv.p;
}

// Configure morgan module to log all requests.
app.use(morgan('dev'));

// Set the front-end folder to serve public assets.
app.use("/lib", express.static(path.join(__dirname, "../../../lib/msal-browser/lib")));

const sampleName = argv.sample;
const isSample = sampleFolders.includes(sampleName);
if (sampleName && isSample) {
    console.log(`Starting sample ${sampleName}`);
    app.use(express.static('app/' + sampleName));
} else {
    if (sampleName && !isSample) {
        console.warn("WARNING: Sample not found.\n");
    }
    console.log("Running default sample.\n");
    app.use(express.static('app/default'));
}

// Set up a route for index.html.
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

// Start the server.
app.listen(port);
console.log(`Listening on port ${port}...`);
