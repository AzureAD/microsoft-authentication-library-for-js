/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
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

// Constants
const DEFAULT_PORT = 3000;
const DEFAULT_SAMPLE_NAME = 'auth-code';
const APP_DIR = `${__dirname}/app`;
const WEB_APP_TYPE = "web"; // Two types, web and CLI applications

// Loads the names of the application directories containing the sample code
function readSampleDirs() {
    return fs.readdirSync(APP_DIR, { withFileTypes: true }).filter(function(file) {
        return file.isDirectory() && file.name !== "sample_template";
    }).map(function(file) {
        return file.name;
    });
}

// Validates that the input sample exists or defaults to auth-code
function validateInputSample(sampleDirs, sampleName) {
    const isSample = sampleDirs.includes(sampleName);
    if (sampleName && isSample) {
        console.log(`Starting sample ${sampleName}`);
        return sampleName;
    } else {
        if (sampleName && !isSample) {
            console.warn("WARNING: Sample not found.\n");
        }
        console.log(`Running default sample: ${DEFAULT_SAMPLE_NAME}.\n`);
        return DEFAULT_SAMPLE_NAME;
    }
}

function initializeWebApp(sampleFilesPath, inputPort) {
    // Build client application
    const clientApplication = require(`${sampleFilesPath}/clientApplication`);

    // Initialize express app
    const app = express();
    const port = (inputPort) ? inputPort : DEFAULT_PORT;
    app.listen(port, () => console.log(`Msal Node Auth Code Sample app listening on port ${port}!`));

    // Load sample routes
    const sampleRoutes = require(`${sampleFilesPath}/routes`);
    sampleRoutes(app, clientApplication);
}




// Main script
const sampleDirs = readSampleDirs();
const sampleName = validateInputSample(sampleDirs, argv.sample);
const sampleFilesPath = `${APP_DIR}/${sampleName}`;

const sampleConfig = require(`${sampleFilesPath}/sampleConfig`);

if (sampleConfig.appType == WEB_APP_TYPE) {
    initializeWebApp(sampleFilesPath, argv.port);
}