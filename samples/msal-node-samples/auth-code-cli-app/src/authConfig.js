const { LogLevel } = require("@azure/msal-node");

const cacheLocation = "./src/data/cache.json";
const cachePlugin = require('../../cachePlugin')(cacheLocation);

module.exports = {
    authConfig: {
        auth: {
            clientId: "c3a8e9df-f1d4-427d-be73-acab139c40fd",
            authority: "https://login.microsoftonline.com/common"
        },
        cache: {
            cachePlugin
        },
        system: {
            loggerOptions: {
                loggerCallback(loglevel, message, containsPii) {
                    console.log(message);
                },
                piiLoggingEnabled: false,
                logLevel: LogLevel.Trace,
            }
        }
    },
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};