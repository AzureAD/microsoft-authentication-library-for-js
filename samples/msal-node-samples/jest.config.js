/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require("fs");
const path = require("path");

const sampleFolders = fs.readdirSync(__dirname, { withFileTypes: true }).filter(function(file) {
    return file.isDirectory() 
        && file.name !== "sample_template" 
        && file.name !== "node_modules" 
        && fs.existsSync(path.resolve(__dirname, file.name, "jest.config.js"));
}).map(function(file) {
    return `<rootDir>/${file.name}`;
});

module.exports = {
    projects : sampleFolders
};