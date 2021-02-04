/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require("fs");
const path = require("path");
const baseTestFolder = `${__dirname}/app/test`;
const sampleFolders = fs.readdirSync(baseTestFolder, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() && file.name !== "sample_template" && file.name !== "node_modules" && fs.existsSync(path.resolve(baseTestFolder, file.name, "jest.config.js"));
}).map(function(file) {
    return `<rootDir>/app/test/${file.name}`;
});
console.log(sampleFolders);
module.exports = {
    projects : sampleFolders
};