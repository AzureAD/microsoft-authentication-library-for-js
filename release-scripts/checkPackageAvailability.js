/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const execSync = require("child_process").execSync;

function getPublishedVersion(packageName) {
    return execSync(`npm view ${packageName} version`).toString().trim();
}

const path = require("path");
const libPath = path.join(__dirname, '..', process.argv[2]);

const packageName = require(`${libPath}/package.json`).name;
const currentVersion = require(`${libPath}/package.json`).version;

let iteration = 0;
const intervalId = setInterval(() => {
    if (iteration > 12) {
        clearInterval(intervalId);
        throw new Error(`Timed out waiting for ${packageName} version ${currentVersion}`);
    }
    const publishedVersion = getPublishedVersion(packageName);
    console.log(publishedVersion);
    if (currentVersion === publishedVersion) {
        console.log(`${packageName} successfully published version ${currentVersion}`);
        clearInterval(intervalId);
        process.exit(0);
    }
    iteration++;
}, 5000);
