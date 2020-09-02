/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
const fs = require('fs');
const path = require('path');
const argv = require('yargs')
    .usage('Usage: $0 -sample [sample-name] -p [PORT] -a [authority-type] --policy [B2C Policy]')
    .alias('s', 'sample')
    .alias('p', 'port')
    .alias('a', 'authority')
    .alias('policy', 'policy')
    .describe('sample', '(Optional) Name of sample to run')
    .describe('port', '(Optional) Port Number - default is 30662')
    .describe('authority', '(Optional) Authority type (AAD, B2C, etc)')
    .describe('policy', '(Optional) B2C policy')
    .strict()
    .argv;

// Constants
const DEFAULT_PORT = 3000;
const DEFAULT_SAMPLE_NAME = 'auth-code';
const AAD_AUTHORITY_TYPE = 'AAD';
const B2C_AUTHORITY_TYPE = 'B2C';
const DEFAULT_B2C_POLICY= 'signUpSignIn';
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
function validateAuthorityType(authorityConfigDirs, authorityType) {
    const isAuthorityType = authorityConfigDirs.includes(authorityType);
    if(authorityType && isAuthorityType) {
        console.log(`Running sample with valid authority type ${authorityType}`);
        return authorityType;
    } else {
        if (authorityType && !isAuthorityType) {
            console.warn(`WARNING: Authority Type ${authorityType} not found.\n`);
        }
        console.log(`Running sample with default authority type: ${AAD_AUTHORITY_TYPE}.\n`);
        return AAD_AUTHORITY_TYPE;
    }
}

// Validates that the input B2C policy exists for the selected sample
function validateB2CPolicy(authorityType, sampleFilesPath, policy) {
    if (authorityType === B2C_AUTHORITY_TYPE) {
        const policiesDir = `${sampleFilesPath}/${authorityType}/policies`;
        const policyFileName = `${policy}.json`;
        const policyExists = fs.readdirSync(policiesDir, { withFileTypes: true })
                               .map(file => file.name)
                               .includes(policyFileName);

        if (policyExists) {
            console.log(`Using B2C policy ${policy}`);
            return policyFileName;
        } else {
            console.log(`WARNING: B2C policy ${policy} not found, using default policy ${DEFAULT_B2C_POLICY}`);
            return `${DEFAULT_B2C_POLICY}.json`;
        }
    }

    return null;
}

function initializeWebApp(sampleFilesPath, inputPort, clientApplication, authorityType) {
    // Initialize MSAL Token Cache
    const msalTokenCache = clientApplication.getTokenCache();

    // Initialize express app
    const app = express();
    const port = (inputPort) ? inputPort : DEFAULT_PORT;

    msalTokenCache.readFromPersistence().then(() => {
        app.listen(port, () => console.log(`Msal Node Auth Code Sample app listening on port ${port}!`));
        // Load sample routes
        const sampleRoutes = require(`${sampleFilesPath}/routes`);
        sampleRoutes(app, clientApplication, msalTokenCache, authorityType);
    })
}

function executeCliApp(sampleFilesPath, inputPort, clientApplication) {
    require(`${sampleFilesPath}/index`)(clientApplication);
}

function generateB2COptions(sampleFilesPath, b2cPolicy) {
    if (b2cPolicy) {
        const basePath = `${sampleFilesPath}/B2C`;
        const authOptionsPath = `${basePath}/authOptions.json`;
        const policyOptionsPath = `${basePath}/policies/${b2cPolicy}`;
        const policyOptions = fs.readFileSync(policyOptionsPath);
        fs.writeFileSync(authOptionsPath, policyOptions);
    }
}




// Main script
function runSample(sample, port, authorityType, policy) {
    // Sample selection
    const sampleDirs = readSampleDirs();
    const sampleName = validateInputSample(sampleDirs, sample);
    const sampleFilesPath = `${APP_DIR}/${sampleName}`;

    // Authority type selection
    const authorityConfigDirs = readAuthorityConfigDirs(sampleFilesPath);
    authorityType = validateAuthorityType(authorityConfigDirs, authorityType);

    // B2C policy selection
    const b2cPolicy = validateB2CPolicy(authorityType, sampleFilesPath, policy);
    generateB2COptions(sampleFilesPath, b2cPolicy);

    // App type selection
    const sampleConfig = require(`${sampleFilesPath}/sampleConfig`);

    // Build client application
    const clientApplication = require(`${sampleFilesPath}/clientApplication`)(authorityType);

    switch(sampleConfig.appType) {
        case WEB_APP_TYPE:
            initializeWebApp(sampleFilesPath, port, clientApplication, authorityType);
            break;
        case CLI_APP_TYPE:
            executeCliApp(sampleFilesPath, port, clientApplication);
            break;
        default:
            console.log("Unsupported appType: ", sampleConfig.appType, clientApplication);
            break;
    }
}

// If the app is executed manually, the $0 argument in argv will correspond to this index.js file
if(argv.$0 === "index.js") {
    console.log("Vanilla JS Test App is being executed manually.");
    runSample(argv.s, argv.p, argv.a, argv.policy);
} else {
    // Whenever argv.$0 is not index.js, it means it was required and executed in an external script
    console.log("Vanilla JS Test App is being executed from an external script.");
}

// Export the main script as a function so it can be executed programatically to enable E2E Test automation
module.exports = runSample;
