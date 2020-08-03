const policies = require("./policies");
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

module.exports = {
    /**
     * Public Client Application Configuration
     */
    auth: {
        clientId: "57eeeaa5-2ff7-497e-84bb-b45fe138ad58",
        authority: policies.b2cPolicies.authorities.signUpSignIn.authority,
        knownAuthorities: ["SAMEERAB2C.b2clogin.com"],
        redirectUri: "http://localhost:3000/redirect",
    },
    cache: {
        cachePlugin,
    },
};
