/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const execSync = require("child_process").execSync;

function checkVersion(packageName, version) {
	return execSync(`npm view ${packageName}@${version}`).toString().trim();
}

const path = require("path");
const libPath = path.join(__dirname, '..', process.argv[2]);

const packageName = require(`${libPath}/package.json`).name;
const currentVersion = require(`${libPath}/package.json`).version;

const versionIsPublished = checkVersion(packageName, currentVersion);

if (versionIsPublished) {
	process.exit(0);
} else {
	process.exit(1);
}
