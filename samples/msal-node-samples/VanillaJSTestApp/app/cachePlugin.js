/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const fs = require('fs');
const msal = require('@azure/msal-node');

 /**
 * Cache Plugin configuration
 */
const cachePath = "./data/cache.json"; // Replace this string with the path to your valid cache file.

const readFromStorage = () => {
    return fs.readFileSync(cachePath, "utf-8");
};

const writeToStorage = (getMergedState) => {
    const oldFile = readFromStorage();
    const mergedState = getMergedState(oldFile);
    return fs.writeFileSync(cachePath, mergedState);
};

module.exports = {
    readFromStorage,
    writeToStorage
}