require('dotenv').config({ path: './AAD.env' });

const msal = require('@azure/msal-node');
const { promises: fs } = require("fs");

const cacheLocation = process.env.CACHE_LOCATION || "./data/cache.json";

const readFromStorage = () => {
    return fs.readFile(cacheLocation, "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then(oldFile =>{
        const mergedState = getMergedState(oldFile);
        return fs.writeFile(cacheLocation, mergedState);
    })
};

const cachePlugin = {
    readFromStorage,
    writeToStorage
};

module.exports = {
    auth: {
        clientId: process.env.APP_CLIENT_ID || "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority: process.env.AUTHORITY || "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};