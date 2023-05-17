/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const checkPackageAndVersion = require("./checkPackageAndVersion.js");
const path = require("path");
const libPath = path.join(__dirname, '..', process.argv[2]);

const { name, version } = require(`${libPath}/package.json`);

const versionIsPublished = checkPackageAndVersion(name, version);

if (versionIsPublished) {
	process.exit(0);
} else {
	process.exit(1);
}
