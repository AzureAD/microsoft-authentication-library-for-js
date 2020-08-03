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

const cachePlugin = {
    readFromStorage,
    writeToStorage,
};

const authority = {
    AADAuthority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
    CommonAuthority: "https://login.microsoftonline.com/common"
}

module.exports = {
    /**
     * Public Client Application Configuration
     */
    auth: {
        clientId: "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority: authority.AADAuthority,
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cachePlugin,
    },
};
