/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
    .usage('Usage: $0 -sample [sample-name] -p [PORT] -a [authority-type]')
    .alias('s', 'sample')
    .alias('p', 'port')
    .alias('a', 'authority')
    .describe('sample', '(Optional) Name of sample to run')
    .describe('port', '(Optional) Port Number - default is 30662')
    .describe('authority', '(Optional) Authority type (AAD, B2C, etc)')
    .strict()
    .argv;

// Constants
const DEFAULT_PORT = 3000;
const DEFAULT_SAMPLE_NAME = 'auth-code';
const DEFAULT_AUTHORITY_TYPE = 'AAD';
const APP_DIR = `${__dirname}/app`;
const WEB_APP_TYPE = "web";
const CLI_APP_TYPE = "cli";

// Loads the names of the application directories containing the sample code
function readSampleDirs() {
    return fs.readdirSync(APP_DIR, { withFileTypes: true }).filter(function(file) {
        return file.isDirectory() && file.name !== "sample_template";
    }).map(function(file) {
        return file.name;
    });
}

// Loads the names of the authority-specific configuration directories inside the given sample path
function readAuthorityConfigDirs(sampleFilesPath) {
    return fs.readdirSync(sampleFilesPath, { withFileTypes: true }).filter(function(file) {
        return file.isDirectory();
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
            console.warn(`WARNING: Sample ${sampleName} not found.\n`);
        }
        console.log(`Running default sample: ${DEFAULT_SAMPLE_NAME}.\n`);
        return DEFAULT_SAMPLE_NAME;
    }
}

// Validates that the input authority type exists for the selected sample
function validateAuthorityType(authorityConfigDirs, sampleFilesPath, authorityType) {
    const isAuthorityType = authorityConfigDirs.includes(authorityType);
    if(authorityType && isAuthorityType) {
        console.log(`Running sample with valid authority type ${authorityType}`);
        return authorityType;
    } else {
        if (authorityType && !isAuthorityType) {
            console.warn(`WARNING: Authority Type ${authorityType} not found.\n`);
        }
        console.log(`Running sample with default authority type: ${DEFAULT_AUTHORITY_TYPE}.\n`);
        return DEFAULT_AUTHORITY_TYPE;
    }
}

function initializeWebApp(sampleFilesPath, inputPort, clientApplication) {
    // Initialize MSAL Token Cache
    const msalTokenCache = clientApplication.getTokenCache();

    // Initialize express app
    const app = express();
    const port = (inputPort) ? inputPort : DEFAULT_PORT;

    msalTokenCache.readFromPersistence().then(() => {
        app.listen(port, () => console.log(`Msal Node Auth Code Sample app listening on port ${port}!`));
        // Load sample routes
        const sampleRoutes = require(`${sampleFilesPath}/routes`);
        sampleRoutes(app, clientApplication, msalTokenCache);
    })
}

function executeCliApp(sampleFilesPath, inputPort, clientApplication) {
    require(`${sampleFilesPath}/index`)(clientApplication);
}




// Main script
const sampleDirs = readSampleDirs();
const sampleName = validateInputSample(sampleDirs, argv.sample);
const sampleFilesPath = `${APP_DIR}/${sampleName}`;

const authorityConfigDirs = readAuthorityConfigDirs(sampleFilesPath);
const authorityType = validateAuthorityType(authorityConfigDirs, sampleFilesPath, argv.a);
const sampleConfig = require(`${sampleFilesPath}/sampleConfig`);

// Build client application
const clientApplication = require(`${sampleFilesPath}/clientApplication`)(authorityType);

switch(sampleConfig.appType) {
    case WEB_APP_TYPE:
        initializeWebApp(sampleFilesPath, argv.port, clientApplication);
        break;git
    case CLI_APP_TYPE:
        executeCliApp(sampleFilesPath, argv.port, clientApplication);
        break;
    default:
        console.log("Unsupported appType: ", sampleConfig.appType, clientApplication);
        break;
}