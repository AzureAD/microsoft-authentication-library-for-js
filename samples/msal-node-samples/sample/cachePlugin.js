const { promises: fs } = require("fs");

/**
 * Cache Plugin configuration
 */
const cachePath = "./data/example.cache.json"; // Replace this string with the path to your valid cache file.

const readFromStorage = () => {
    return fs.readFile(cachePath, "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then((oldFile) => {
        const mergedState = getMergedState(oldFile);
        return fs.writeFile(cachePath, mergedState);
    });
};

module.exports = {
    cachePlugin: {
        readFromStorage,
        writeToStorage,
    }
};
