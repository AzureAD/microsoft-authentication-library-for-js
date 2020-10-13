/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const fs = require('fs');

 /**
 * Cache Plugin configuration
 */

module.exports = function(cacheLocation) {
    const cachePath = cacheLocation;
    const readFromStorage = () => {
        return fs.readFileSync(cachePath, "utf-8");
    };
    
    const writeToStorage = (getMergedState) => {
        const oldFile = readFromStorage();
        const mergedState = getMergedState(oldFile);
        return fs.writeFileSync(cachePath, mergedState);
    };
    
    return {
        readFromStorage,
        writeToStorage
    }
}