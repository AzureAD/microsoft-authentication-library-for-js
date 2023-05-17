/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const checkPackageAndVersion = require("./checkPackageAndVersion.js");
const path = require("path");
const libPath = path.join(__dirname, '..', process.argv[2]);

const { name, version } = require(`${libPath}/package.json`);

let iteration = 0;
const intervalId = setInterval(() => {
    if (iteration > 12) {
        clearInterval(intervalId);
        throw new Error(`Timed out waiting for ${name} version ${version}`);
    }
    const versionIsPublished = checkPackageAndVersion(name, version);
    if (versionIsPublished) {
        console.log(`${name} successfully published version ${version}`);
        clearInterval(intervalId);
        process.exit(0);
    }
    iteration++;
}, 5000);
