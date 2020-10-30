/*
 *  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 *  See LICENSE in the source repository root for complete license information.
 */
import fs from "fs";
import path from "path";
import { exec } from "shelljs";
import * as child from 'child_process';

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
const APP_DIR = PARENT_DIR + "/src/e2eTest"

// Get all sample folders
const sampleFolders = fs.readdirSync(APP_DIR, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && file.name !== "sample_template";
}).map(function(file) {
    return file.name;
});

// Clear require cache and create new mocha object to run new set of tests
function createMochaObject(sampleName: string) {
    // Required to allow mocha to run multiple times
    clearRequire.match(new RegExp("mocha"));
    clearRequire.match(new RegExp(".spec.ts$"));
    const Mocha = require("mocha");
    const mochaObj = new Mocha({});

    // Get directory of test files for sample
    const testDir = `${APP_DIR}/${sampleName}`;
    // Filters test files and adds them to mocha
    fs.readdirSync(testDir).filter(function(file) {
        // Only keep the *.spec.ts files
        return file.substr(-8) === ".spec.ts";
    }).forEach(function(file) {
        mochaObj.addFile(path.join(testDir, file));
    });

    return mochaObj;
}

// Recursive test runner for each sample
let didFail: boolean = false;
function runMochaTests(sampleIndex: number) {
    const sampleName = sampleFolders[sampleIndex];
    const mocha = createMochaObject(sampleName);

    const server: child.ChildProcess = exec("npm start", {async: true}) as child.ChildProcess;

    console.log(`Running tests for ${sampleName}`);
    setTimeout(() => {
        server.kill();
    }, 3000);
    // mocha.run(function(failures: number) {
    //     // exit with non-zero status if there were failures
    //     server.kill();
    //     sampleIndex++;
    //     if (failures) {
    //         didFail = true;
    //     }
    //     if (sampleIndex < sampleFolders.length) {
    //         runMochaTests(sampleIndex);
    //     }
    //     process.exitCode = didFail ? 1 : 0;
    // });
}

// Start mocha tests
runMochaTests(0);
