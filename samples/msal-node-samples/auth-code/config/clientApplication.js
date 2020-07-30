require('dotenv').config();

const msal = require('@azure/msal-node');
const { promises: fs } = require("fs");

const readFromStorage = () => {
    return fs.readFile("./data/cache.json", "utf-8");
};

const writeToStorage = (getMergedState) => {
    return readFromStorage().then(oldFile =>{
        const mergedState = getMergedState(oldFile);
        return fs.writeFile("./data/cacheAfterWrite.json", mergedState);
    })
};

const cachePlugin = {
    readFromStorage,
    writeToStorage
};

module.exports = {
    auth: {
        clientId: process.env.APP_CLIENT_ID || "99cab759-2aab-420b-91d8-5e3d8d4f063b",
        authority: "https://login.microsoftonline.com/common",
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