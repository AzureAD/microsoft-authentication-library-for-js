/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const packageJsonPath = path.resolve(process.cwd(), "package.json");
const { name, version } = require(packageJsonPath);
const fs = require("fs");

const data = {
    name: name,
    version: version
};

const outputFilepath = path.resolve(process.cwd(), "src", "version.json");
fs.writeFileSync(outputFilepath, JSON.stringify(data));
