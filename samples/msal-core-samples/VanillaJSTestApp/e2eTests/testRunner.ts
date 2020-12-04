/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
import express from 'express';
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
const argv = require("yargs")
    .options({
        d: {
            alias: "debug",
            type: "boolean"
        }
    })
    .argv;
const clearRequire = require("clear-module");

// Set up constants
const DEFAULT_PORT = 30662;
const PARENT_DIR = path.dirname(".");
const APP_DIR = PARENT_DIR + `/app`;

// Get all sample folders
const sampleFolders = fs.readdirSync(APP_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && file.name !== `sample_template` && fs.existsSync(`${APP_DIR}/${file.name}/test`);
}).map(function(file) {
    return file.name;
});

// Clear require cache and create new mocha object to run new set of tests
function createMochaObject(sampleName: string) {
    // Required to allow mocha to run multiple times
    clearRequire.match(new RegExp("mocha"));
    clearRequire.match(new RegExp(".spec.ts$"))
    let Mocha = require("mocha");
    let mochaObj = new Mocha({});

    // Get directory of test files for sample
    const testDir = `${APP_DIR}/${sampleName}/test`;
    // Filters test files and adds them to mocha
    fs.readdirSync(testDir).filter(function(file) {
        // Only keep the *.spec.ts files
        return file.substr(-8) === ".spec.ts"
    }).forEach(function(file) {
        mochaObj.addFile(path.join(testDir, file));
    });

    return mochaObj;
}

// Recursive test runner for each sample
let didFail: boolean = false;
function runMochaTests(sampleIndex: number) {
    //initialize express.
    const app = express();

    // Initialize variables.
    let port = DEFAULT_PORT; // 30662;

    // Configure morgan module to log all requests.
    if (argv.debug) {
        app.use(morgan("dev"));
    }

    // Set the front-end folder to serve public assets.
    app.use("/dist", express.static(path.join(PARENT_DIR, "../../../lib/msal-core/dist")));
    
    let sampleName = sampleFolders[sampleIndex];
    const mocha = createMochaObject(sampleName);
    app.use(express.static(`${APP_DIR}/${sampleName}`));

    // Set up a route for index.html.
    app.get('*', function (req, res) {
        res.sendFile(path.join(`${APP_DIR}/${sampleName}/index.html`));
    });

    let server = app.listen(port);
    console.log(`Listening on port ${port}...`);

    console.log(`Running tests for ${sampleName}`);
    mocha.run(function(failures: number) {
          // exit with non-zero status if there were failures
        server.close();
        sampleIndex++;
        if (failures) {
            didFail = true;
        }
        if (sampleIndex < sampleFolders.length) {
            runMochaTests(sampleIndex);
        }
        process.exitCode = didFail ? 1 : 0;
    });
}

// Start mocha tests
runMochaTests(0);
